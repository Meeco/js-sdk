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

@test "Create a 'Profile' card template" {    
    meeco items:create-config miksit_profile -a .Alice.yaml > .template_profile.yaml

    cat .template_profile.yaml |
    yq -y '(.spec.label) = "My Profile"' |
    yq -y '(.spec.slots[0].name) = "name"' |
    yq -y '(.spec.slots[0].value) = "alice"' |
    yq -y '(.spec.slots[1].name) = "surname"' |
    yq -y '(.spec.slots[1].value) = "smith"' |
    yq -y '(.spec.slots[2].name) = "dob"' |
    yq -y '(.spec.slots[2].value) = "1/1/2000"' |
    yq -y '(.spec.slots[3].name) = "gender"' |
    yq -y '(.spec.slots[3].value) = "female"' |
    yq -y '(.spec.slots[4].name) = "country"' |
    yq -y '(.spec.slots[4].value) = "australia"' > .my_profile.yaml

    cat .my_profile.yaml
    cat ./e2e-assert-output/my_profile.yaml | assert_output
}

@test "Create a 'Profile' item" {    
    run meeco items:create -i .my_profile.yaml -a .Alice.yaml > .item_alice.yaml
    [ "$status" -eq 0 ]
}
