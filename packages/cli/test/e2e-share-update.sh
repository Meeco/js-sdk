#!/bin/bash
set -e
shopt -s expand_aliases
alias run="node --require tsconfig-paths/register ./bin/run"

echo "Create user 'Alice'"
run users:create -p supersecretpassword > .Alice.yaml

echo "Create a 'Vehicle' card template for 'Alice'"
run items:create-config vehicle -a .Alice.yaml > .vehicle_item_config.yaml

yq -i '
  (.spec.label) = "My Vehicle" |
  (.spec.slots[0].value) = "20000101" |
  (.spec.slots[1].value) = "ABC123" |
  (.spec.slots[2].value) = "Mazda" |
  (.spec.slots[3].value) = "Familia" |
  (.spec.slots[4].value) = "VIN3322112223"
' .vehicle_item_config.yaml

echo "Create a 'Vehicle' card for 'Alice'"
run items:create -i .vehicle_item_config.yaml -a .Alice.yaml > .item_alice.yaml

echo "Create user 'Bob'"
run users:create -p supersecretpassword > .Bob.yaml

echo "Setup a connection between 'Alice' and 'Bob'"
run connections:create-config --from .Alice.yaml --to .Bob.yaml > .connection_Alice_Bob.yaml
run connections:create -c .connection_Alice_Bob.yaml > .connection_Alice_Bob.created.yaml

connectionIdAB=$(cat .connection_Alice_Bob.created.yaml | yq -r .spec.from_user_connection_id)

itemId=$(cat .item_alice.yaml | yq -r .spec.id)

echo "item id: ${itemId}"
echo "connection id alice to bob: ${connectionIdAB}"

echo "Share alice to bob"
run shares:create-config --from .Alice.yaml --connection .connection_Alice_Bob.created.yaml -i .item_alice.yaml > .share_Alice_Bob.yaml
run shares:create -c .share_Alice_Bob.yaml --onshare > .share_Alice_Bob.created.yaml

bobsShareId=$(cat .share_Alice_Bob.created.yaml | yq -r '.shares[0].id')
echo "bob's share id: ${bobsShareId}"

echo "Read share as bob"
run shares:get-incoming $bobsShareId -a .Bob.yaml

echo "Update Item as alice"

yq -i "
  (.spec.id) = \"${itemId}\" |
  (.spec.slots[0].value) = \"30000101\" |
  (.spec.slots[1].value) = \"XYZ123\" |
  (.spec.slots[2].value) = \"Toyota\" |
  (.spec.slots[3].value) = \"YOOO\" |
  (.spec.slots[4].value) = \"VIN00000000\"
" .vehicle_item_config.yaml

run items:update -i .vehicle_item_config.yaml -a .Alice.yaml > .item_alice.yaml

echo "Update Share as alice"
run shares:update $itemId -a .Alice.yaml

echo "Read shared item bob"
run shares:get-incoming $bobsShareId -a .Bob.yaml
