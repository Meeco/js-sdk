#!./test/libs/bats/bin/bats

load 'libs/bats-support/load'
load 'libs/bats-assert/load'

set -e
shopt -s expand_aliases
alias meeco="node --require tsconfig-paths/register ./bin/run"

@test "should create user and retrive user" {    
    meeco users:create -p supersecretpassword > .Alice.yaml
    assert [ -e '.Alice.yaml' ] 

    meeco users:login -p supersecretpassword -a .Alice.yaml > .Alice_login.yaml

    cat .Alice.yaml
    cat .Alice_login | assert_output
}

@test "Create a 'Vehicle' card template" {    
    meeco items:create-config vehicle -a .Alice.yaml > .template_vehicle.yaml

    cat .template_vehicle.yaml |
    yq -y '(.spec.label) = "My Vehicle"'|
    yq -y '(.spec.slots[0].value) = "20000101"' | 
    yq -y '(.spec.slots[1].value) = "ABC123"' |
    yq -y '(.spec.slots[2].value) = "Mazda"' |
    yq -y '(.spec.slots[3].value) = "Familia"' |
    yq -y '(.spec.slots[4].value) = "VIN3322112223"' > .my_vehicle.yaml

    cat .my_vehicle.yaml
    cat ./e2e-assert-output/.my_vehicle.yaml | assert_output
}

@test "Create a 'Vehicle' item" {    
    run meeco items:create -i .my_vehicle.yaml -a .Alice.yaml > .item_alice.yaml    
    [ "$status" -eq 0 ]
}
