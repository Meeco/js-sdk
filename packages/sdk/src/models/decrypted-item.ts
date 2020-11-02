import {
  Association,
  Attachment,
  ClassificationNode,
  EncryptedSlotValue,
  Item,
  ItemResponse,
  ItemsIdSharesSlotValues,
  Slot,
  Thumbnail,
} from '@meeco/vault-api-sdk';
import cryppo from '../services/cryppo-service';
import { ItemService } from '../services/item-service';
import { IDEK } from '../services/service';
import {
  VALUE_VERIFICATION_KEY_LENGTH,
  valueVerificationHash,
  verifyHashedValue,
} from '../util/value-verification';
import { EncryptionKey } from './encryption-key';
import { NewSlot, SDKDecryptedSlot, toNameSlotMap } from './local-slot';
import { UpdateItem } from './update-item';

// construct from existing Item object
// construct an update for an Item with known id

// uses:
// POST items/id/shares
// PUT items/id/shares
// POST items/id/encrypt
// POST items
// PUT items
// ignore pUT slots
// get attachments
// get class nodes

export class DecryptedItem {
  private static readonly cryppo = (<any>global).cryppo || cryppo;

  public readonly thumbnails: Thumbnail[];
  public readonly associations: Association[];
  public readonly associations_to: Association[];
  public readonly attachments: Attachment[];

  /** The `Item` as it exists within the API */
  public readonly rawItem: Item;

  /** The `Slots` as they exist in the API */
  public readonly slots: SDKDecryptedSlot[];

  // These apply to either the Item or any of its Slots
  public readonly classification_nodes: ClassificationNode[];

  public static async fromAPI(key: IDEK, response: ItemResponse) {
    const slots = await Promise.all(
      response.slots.map(s => DecryptedItem.decryptSlot(s, key.data_encryption_key))
    );
    return new DecryptedItem(response.item, slots, response);
  }

  public static async decryptSlot(slot: Slot, dek: EncryptionKey): Promise<SDKDecryptedSlot> {
    function throwIfNull<T>(descriptor: string) {
      return (x: T | null) => {
        if (x === null) {
          throw new Error(`${descriptor} was null, but should have a value`);
        }

        return x;
      };
    }

    // ensure result really does match the type
    function cleanResult(spec: {
      encrypted: boolean;
      value: string | null;
      value_verification_key: string | null;
    }): SDKDecryptedSlot {
      const decrypted: any = {
        ...slot,
        ...spec,
      };

      delete decrypted.encrypted_value;
      delete decrypted.encrypted_value_verification_key;

      return decrypted;
    }

    if (!slot.encrypted) {
      return cleanResult({
        encrypted: false,
        value: null,
        value_verification_key: null,
      });
    } else if (slot.encrypted_value === null) {
      // need to check encrypted_value as binaries will also have `encrypted: true`
      return cleanResult({
        encrypted: true,
        value: null,
        value_verification_key: null,
      });
    }

    const value = await cryppo
      .decryptStringWithKey({
        key: dek.key,
        serialized: slot.encrypted_value,
      })
      .then(throwIfNull('Slot decrypted value'));

    let decryptedValueVerificationKey: string | null = null;

    if (slot.encrypted_value_verification_key != null) {
      decryptedValueVerificationKey = await DecryptedItem.cryppo
        .decryptStringWithKey({
          serialized: slot.encrypted_value_verification_key,
          key: dek.key,
        })
        .then(throwIfNull('Slot decrypted value_verification_key'));

      if (
        !slot.own &&
        slot.value_verification_hash !== null &&
        !verifyHashedValue(
          <string>decryptedValueVerificationKey,
          value,
          slot.value_verification_hash
        )
      ) {
        throw new Error(
          `Decrypted slot ${slot.name} with value ${value} does not match original value.`
        );
      }
    }

    return cleanResult({
      encrypted: false,
      value,
      value_verification_key: decryptedValueVerificationKey,
    });
  }

  constructor(
    item: Item,
    slots: SDKDecryptedSlot[] = [],
    extra: Partial<{
      classification_nodes: ClassificationNode[];
      associations: Association[];
      associations_to: Association[];
      attachments: Attachment[];
      thumbnails: Thumbnail[];
    }> = {}
  ) {
    this.rawItem = item;
    Object.assign(this, item);
    // TODO should we remove X_ids fields which are replaced?

    this.slots = slots;
    this.classification_nodes = extra.classification_nodes || [];

    this.attachments = extra.attachments || [];

    // TODO do these need to be filtered by id?
    this.thumbnails = extra.thumbnails || [];
    this.associations = extra.associations || [];
    this.associations_to = extra.associations_to || [];
  }

  // TODO: the origianl copy of an Item is not updated with a share_id
  /** True if the Item is shared either with you or someone else */
  // isShared(): boolean {
  //   return !!this.existingItem && !!this.existingItem['share_id'];
  // }

  /** True if you are the original creator of this Item */
  isOwned(): boolean {
    return this.own;
  }

  /** True if this Item is shared with you */
  isReceived(): boolean {
    return !this.isOwned() && !!this.share_id;
  }

  // only know the following by inspecting a share
  // isEncryptedWithSharedKey(): boolean {
  //   return false;
  // }

  // isReencrypted(): boolean {
  //   return false;
  // }

  toMap(): Record<string, SDKDecryptedSlot> {
    return toNameSlotMap(this);
  }

  /**
   * Stage updated values in an UpdateItem.
   * This has no effect on the values stored in this DecryptedItem.
   */
  toUpdateItem(
    update: Partial<{
      label: string;
      classificationNodes: ClassificationNode[];
      slots: NewSlot[];
    }>
  ): UpdateItem {
    // TODO should zip slots with existing ones
    return new UpdateItem(this.id, update);
  }

  // for PUT items/id/shares
  // - must include all slot ids in the parent
  // - must re-encrypt VVK if present on slots
  // - must generate VVH and Key if required and only if owned
  async toShareSlots(
    credentials: IDEK,
    shareId: string,
    verificationKey?: string
  ): Promise<ItemsIdSharesSlotValues[]> {
    const valueVerificationKey =
      verificationKey ||
      (DecryptedItem.cryppo.generateRandomKey(VALUE_VERIFICATION_KEY_LENGTH) as string);

    const encryptedValueVerificationKey: string = await DecryptedItem.cryppo
      .encryptStringWithKey({
        data: valueVerificationKey,
        key: credentials.data_encryption_key.key,
        strategy: DecryptedItem.cryppo.CipherStrategy.AES_GCM,
      })
      .then(result => result.serialized!);

    return Promise.all(
      this.slots.map(async s => {
        const encrypted = await ItemService.encryptSlot(credentials, s);

        if (s.value) {
          return {
            share_id: shareId,
            slot_id: s.id,
            encrypted_value: encrypted.encrypted_value,
            encrypted_value_verification_key: encryptedValueVerificationKey,
            value_verification_hash: valueVerificationHash(valueVerificationKey, s.value),
          };
        } else {
          return {
            share_id: shareId,
            slot_id: s.id,
          };
        }
      })
    );
  }

  /**
   * Clone the Item
   * @param templateName Required, as the API doesn't provide it in the Item type.
   */
  // toNewItem(templateName: string): NewItem {
  //   return new NewItem(
  //     this.label,
  //     templateName,
  //     this._slots.map(s => toNestedSlot(s))
  //   );
  // }

  // for POST /items/id/share
  // note that for PUT /items/id/share these must be zipped with share_ids
  // note that POST /items/id/encrypt takes slots with just id, encrypted_value
  async toEncryptedSlotValues(credentials: IDEK): Promise<EncryptedSlotValue[]> {
    return Promise.all(
      this.slots.map(async slot => {
        const withHash = await ItemService.addVerificationHash(
          slot,
          credentials.data_encryption_key
        );
        const {
          id,
          encrypted_value,
          encrypted_value_verification_key,
          value_verification_hash,
        } = await ItemService.encryptSlot(credentials, withHash);

        // TODO due to an API bug, this doesn't typecheck when encrypted_value is undefined
        return {
          slot_id: id,
          encrypted_value,
          encrypted_value_verification_key,
          value_verification_hash,
        } as EncryptedSlotValue;
      })
    );
  }
}

// Ensure Item properties are exposed by DecryptedItem
// tslint:disable-next-line:interface-name
export interface DecryptedItem extends Item {}
