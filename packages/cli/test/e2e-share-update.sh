#!/bin/bash
set -e
shopt -s expand_aliases
alias run="node --require tsconfig-paths/register ./bin/run"

echo "Create user 'Alice'"
run users:create -p supersecretpassword > .Alice.yaml

echo "Create a 'Vehicle' card template for 'Alice'"
run items:create-config vehicle -a .Alice.yaml > .template_vehicle.yaml

cat .template_vehicle.yaml |
yq -y '(.spec.label) = "My Vehicle"'|
yq -y '(.spec.slots[0].value) = "20000101"' |
yq -y '(.spec.slots[1].value) = "ABC123"' |
yq -y '(.spec.slots[2].value) = "Mazda"' |
yq -y '(.spec.slots[3].value) = "Familia"' |
yq -y '(.spec.slots[4].value) = "VIN3322112223"' > .my_vehicle.yaml

echo "Create a 'Vehicle' card for 'Alice'"
run items:create -i .my_vehicle.yaml -a .Alice.yaml > .item_alice.yaml

echo "Create user 'Bob'"
run users:create -p supersecretpassword > .Bob.yaml

echo "Setup a connection between 'Alice' and 'Bob'"
run connections:create-config --from .Alice.yaml --to .Bob.yaml > .connection_Alice_Bob.yaml
run connections:create -c .connection_Alice_Bob.yaml > .connection_Alice_Bob.created.yaml

connectionIdAB=$(cat .connection_Alice_Bob.created.yaml | yq -r .metadata.from_user_connection_id)

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
cat template_vehicle_update.yaml |
yq -y --arg a ${itemId} '(.spec.id) = $a' |
yq -y '(.spec.slots[0].value) = "30000101"' |
yq -y '(.spec.slots[1].value) = "XYZ123"' |
yq -y '(.spec.slots[2].value) = "Toyota"' |
yq -y '(.spec.slots[3].value) = "YOOO"' |
yq -y '(.spec.slots[4].value) = "VIN00000000"' > .my_vehicle_update.yaml

run items:update -i .my_vehicle_update.yaml -a .Alice.yaml > .item_alice.yaml

echo "Update Share as alice"
run shares:update $itemId -a .Alice.yaml

echo "Read shared item bob"
run shares:get-incoming $bobsShareId -a .Bob.yaml
