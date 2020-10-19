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

echo "Create user 'Carol'"
run users:create -p supersecretpassword > .Carol.yaml

echo "Setup a connection between 'Alice' and 'Bob'"
run connections:create-config --from .Alice.yaml --to .Bob.yaml > .connection_Alice_Bob.yaml
run connections:create -c .connection_Alice_Bob.yaml > .connection_Alice_Bob.created.yaml

echo "Setup a connection between 'Bob' and 'Carol'"
run connections:create-config --from .Bob.yaml --to .Carol.yaml > .connection_Bob_Carol.yaml
run connections:create -c .connection_Bob_Carol.yaml > .connection_Bob_Carol.created.yaml

connectionIdAB=$(cat .connection_Alice_Bob.created.yaml | yq -r .metadata.from_user_connection_id)
connectionIdBC=$(cat .connection_Bob_Carol.created.yaml | yq -r .metadata.from_user_connection_id)

itemId=$(cat .item_alice.yaml | yq -r .spec.id)

echo "item id: ${itemId}"
echo "connection id alice to bob: ${connectionIdAB}"
echo "connection id bob to carol: ${connectionIdBC}"

dateAFter30Days=$(date +'%Y-%m-%d' -d "30 day")

echo "Share alice to bob"
run shares:create-config --from .Alice.yaml --connection .connection_Alice_Bob.created.yaml -i .item_alice.yaml > .share_Alice_Bob.yaml
run shares:create -c .share_Alice_Bob.yaml -m anyone -d $dateAFter30Days > .share_Alice_Bob.created.yaml

bobsShareId=$(cat .share_Alice_Bob.created.yaml | yq -r '.shares[0].id')
echo "bob's share id: ${bobsShareId}"

# we need to get the item spec
run shares:get-incoming $bobsShareId -a .Bob.yaml > .shared_item_with_share_Bob.yaml
bobsItemId=$(cat .shared_item_with_share_Bob.yaml | yq -r '.item.id')
run items:get $bobItemId > .shared_item_Bob.yaml

echo "Share bob to carol (create config)"
run shares:create-config --from .Bob.yaml --connection .connection_Bob_Carol.created.yaml -i $bobItemId > .share_Bob_Carol.yaml

dateAFter29Days=$(date +'%Y-%m-%d' -d "29 day")
echo "Share bob to carol (create share)"
run shares:create -c .share_Bob_Carol.yaml -d $dateAFter29Days > .share_Bob_Carol.created.yaml

carolsShareId=$(cat .share_Bob_Carol.created.yaml | yq -r '.shares[0].id')
echo "carol's share id: ${carolsShareId}"

echo "Read share as carol"
run shares:get-incoming $bobsShareId -a .Carol.yaml
