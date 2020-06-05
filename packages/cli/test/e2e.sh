#!/bin/bash
set -e
shopt -s expand_aliases
alias run="node --require tsconfig-paths/register ./bin/run"

echo "Create user 'Alice'"
run users:create -p supersecretpassword > .Alice.yaml
echo "Fetch template list"
run templates:list -a .Alice.yaml
echo "Create a 'Vehicle' card template for 'Alice'"
run items:create-config ng_vehicle -a .Alice.yaml > .template_vehicle.yaml
sed '5,6 s/label: ""/label: "My Vehicle"/' .template_vehicle.yaml > .my_vehicle.yaml
echo "Create a 'Vehicle' card for 'Alice'"
run items:create -i .my_vehicle.yaml -a .Alice.yaml
echo "Create user 'Bob'"
run users:create -p supersecretpassword > .Bob.yaml
echo "Setup a connection between 'Bob' and 'Alice'"
run connections:create-config --from .Alice.yaml --to .Bob.yaml > .connection_Alice_Bob.yaml
run connections:create -c .connection_Alice_Bob.yaml
echo "List 'Alice's items and prepare one for sharing"
run items:list -a .Alice.yaml
itemid=`run items:list -a .Alice.yaml | awk '/^  - id: / {print $3}'`
run shares:create-config --from .Alice.yaml --to .Bob.yaml -i $itemid > .share_Alice_Bob.yaml
echo "Share the card to 'Bob'"
run shares:create -c .share_Alice_Bob.yaml
echo "Fetch the shared card as 'Bob'"
run shares:list -a .Bob.yaml