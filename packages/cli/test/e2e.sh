#!/bin/bash
set -e
echo "Create user 'Alice'"
./bin/run users:create -p supersecretpassword > .Alice.yaml
echo "Fetch template list"
./bin/run templates:list -a .Alice.yaml
echo "Create a 'Vehicle' card template for 'Alice'"
./bin/run items:create-config vehicle -a .Alice.yaml > .template_vehicle.yaml
sed '5,6 s/label: ""/label: "My Vehicle"/' .template_vehicle.yaml > .my_vehicle.yaml
echo "Create a 'Vehicle' card for 'Alice'"
./bin/run items:create -i .my_vehicle.yaml -a .Alice.yaml
echo "Create user 'Bob'"
./bin/run users:create -p supersecretpassword > .Bob.yaml
echo "Setup a connection between 'Bob' and 'Alice'"
./bin/run connections:create-config --from .Alice.yaml --to .Bob.yaml > .connection_Alice_Bob.yaml
./bin/run connections:create -c .connection_Alice_Bob.yaml
echo "List 'Alice's items and prepare one for sharing"
./bin/run items:list -a .Alice.yaml
itemid=`./bin/run items:list -a .Alice.yaml | awk '/^  - id: / {print $3}'`
./bin/run shares:create-config --from .Alice.yaml --to .Bob.yaml -i $itemid > .share_Alice_Bob.yaml
echo "Share the card to 'Bob'"
./bin/run shares:create -c .share_Alice_Bob.yaml
echo "Fetch the shared card as 'Bob'"
./bin/run shares:list -a .Bob.yaml