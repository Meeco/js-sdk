#!/bin/bash

# INFO
# expects yq version 4

set -e
shopt -s expand_aliases
alias run="node --require tsconfig-paths/register ./bin/run"

echo "Create user 'Alice'"
run users:create -p supersecretpassword > .Alice.yaml
echo "Fetch template list"
run templates:list -a .Alice.yaml
echo "Create a 'Vehicle' card template for 'Alice'"
run items:create-config vehicle -a .Alice.yaml > .template_vehicle.yaml
sed '5,6 s/label: ""/label: "My Vehicle"/' .template_vehicle.yaml > .my_config_vehicle.yaml
echo "Create a 'Vehicle' card for 'Alice'"
run items:create -i .my_config_vehicle.yaml -a .Alice.yaml > .my_vehicle.yaml
echo "Create user 'Bob'"
run users:create -p supersecretpassword > .Bob.yaml
echo "Setup a connection between 'Bob' and 'Alice'"
run connections:create-config --from .Alice.yaml --to .Bob.yaml > .connection_config_Alice_Bob.yaml
run connections:create -c .connection_config_Alice_Bob.yaml > .connection_Alice_Bob.yaml
echo "List 'Alice's items and prepare one for sharing"
run items:list -a .Alice.yaml
run shares:create-config --from .Alice.yaml -c .connection_Alice_Bob.yaml -i .my_vehicle.yaml > .share_Alice_Bob.yaml
echo "Share the card to 'Bob'"
run shares:create -c .share_Alice_Bob.yaml
echo "Fetch shared cards as 'Bob'"
shareId=`run shares:list -a .Bob.yaml | awk '/^  - id: / {print $3}'`
echo "Fetch one shard card as Bob"
run shares:get-incoming $shareId -a .Bob.yaml
