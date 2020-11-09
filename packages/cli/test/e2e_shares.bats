#!./test/libs/bats/bin/bats

load 'libs/bats-support/load'
load 'libs/bats-assert/load'

set -e
shopt -s expand_aliases
alias meeco="node --require tsconfig-paths/register ./bin/run"


@test "Create user Alice and retrive user login detail" {    
    meeco users:create -p supersecretpassword > .Alice.yaml
    assert [ -e '.Alice.yaml' ] 

    meeco users:login -p supersecretpassword -a .Alice.yaml > .Alice_login.yaml

    cat .Alice.yaml
    cat .Alice_login | assert_output
}

@test "Create a 'Esafe Vehicle' item template for Alice" {    
    meeco items:create-config vehicle -a .Alice.yaml > .template_vehicle.yaml

    cat .template_vehicle.yaml |
    yq -y '(.spec.label) = "My Vehicle"'|
    yq -y '(.spec.slots[0].value) = "20000101"' | 
    yq -y '(.spec.slots[1].value) = "ABC123"' |
    yq -y '(.spec.slots[2].value) = "Mazda"' |
    yq -y '(.spec.slots[3].value) = "Familia"' |
    yq -y '(.spec.slots[4].value) = "VIN3322112223"' > .template_updated_alice_vehicle.yaml

    cat .template_updated_alice_vehicle.yaml
    cat ./e2e-assert-output/template_updated_alice_vehicle.yaml | assert_output
}

@test "Create a 'Esafe Vehicle' item for Alice" {    
    meeco items:create -i .template_updated_alice_vehicle.yaml -a .Alice.yaml > .vehicle_alice.yaml
    assert_success
}

@test "Create user Bob and retrive user login detail" {

    echo "Create user 'Bob'"
    meeco users:create -p supersecretpassword > .Bob.yaml
    assert [ -e '.Bob.yaml' ] 

    meeco users:login -p supersecretpassword -a .Bob.yaml > .Bob_login.yaml

    cat .Bob.yaml
    cat .Bob_login | assert_output
}

@test "Create Connection between Alice and Bob" {
    echo "Setup a connection between 'Alice' and 'Bob'"
    meeco connections:create-config --from .Alice.yaml --to .Bob.yaml > .connection_Alice_Bob.yaml
    meeco connections:create -c .connection_Alice_Bob.yaml > .connection_Alice_Bob.created.yaml
    assert_success
}

@test "Share Alice Vehicle Item with Bob " {

    dateAFter30Days=$(date +'%Y-%m-%d' -d "30 day")

    echo "Share alice to bob"
    meeco shares:create-config --from .Alice.yaml --connection .connection_Alice_Bob.created.yaml -i .vehicle_alice.yaml > .share_Alice_Bob.yaml
    meeco shares:create -c .share_Alice_Bob.yaml --onshare true -d $dateAFter30Days > .share_Alice_Bob.created.yaml

    assert_success
}

@test "Create a 'miksit profile' item template for Alice " {

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
    yq -y '(.spec.slots[4].value) = "australia"' > .template_updated_alice_profile.yaml

    cat .template_updated_alice_profile.yaml
    cat ./e2e-assert-output/template_updated_alice_profile.yaml | assert_output
}

@test "Create a profile item for Alice" {    
    meeco items:create -i .template_updated_alice_profile.yaml -a .Alice.yaml > .profile_alice.yaml
    assert_success
}

@test "Share Alice profile single slot with Bob" {

    dateAFter30Days=$(date +'%Y-%m-%d' -d "30 day")

    echo "Share alice to bob"
    meeco shares:create-config --from .Alice.yaml --connection .connection_Alice_Bob.created.yaml -i .profile_alice.yaml -s dob > .share_Alice_Bob_Single_Slot_dob.yaml
    meeco shares:create -c .share_Alice_Bob_Single_Slot_dob.yaml --onshare true -d $dateAFter30Days > .share_Alice_Bob_Single_Slot_dob.created.yaml

    assert_success
}

@test "Create a 'miksit profile' item template for Bob " {

    meeco items:create-config miksit_profile -a .Bob.yaml > .template_profile_for_bob.yaml

    cat .template_profile_for_bob.yaml |
    yq -y '(.spec.label) = "My Profile"' |
    yq -y '(.spec.slots[0].name) = "name"' |
    yq -y '(.spec.slots[0].value) = "bob"' |
    yq -y '(.spec.slots[1].name) = "surname"' |
    yq -y '(.spec.slots[1].value) = "smith"' |
    yq -y '(.spec.slots[2].name) = "dob"' |
    yq -y '(.spec.slots[2].value) = "1/1/1990"' |
    yq -y '(.spec.slots[3].name) = "gender"' |
    yq -y '(.spec.slots[3].value) = "male"' |
    yq -y '(.spec.slots[4].name) = "country"' |
    yq -y '(.spec.slots[4].value) = "australia"' > .template_updated_bob_profile.yaml

    cat .template_updated_bob_profile.yaml
    cat ./e2e-assert-output/template_updated_bob_profile.yaml | assert_output
}

@test "Create a profile item for Bob" {    
    meeco items:create -i .template_updated_bob_profile.yaml -a .Bob.yaml > .profile_bob.yaml
    assert_success
}

@test "Create user Jane" {

    echo "Create user 'Jane'"
    meeco users:create -p supersecretpassword > .Jane.yaml
    assert [ -e '.Bob.yaml' ] 
}

@test "Create Connection from Bob to Jane" {
    echo "Setup a connection from 'Bob' to 'Jane'"
    meeco connections:create-config --from .Bob.yaml --to .Jane.yaml > .connection_Bob_Jane.yaml
    meeco connections:create -c .connection_Bob_Jane.yaml > .connection_Bob_Jane.created.yaml
    assert_success
}

@test "Share Bob profile with Jane with Share terms and conditions" {

    dateAFter30Days=$(date +'%Y-%m-%d' -d "30 day")

    echo "Share bob to Jane"
    meeco shares:create-config --from .Bob.yaml --connection .connection_Bob_Jane.created.yaml -i .profile_bob.yaml -s dob > .share_Bob_Jane_Profile_With_Terms.yaml
    meeco shares:create -c .share_Bob_Jane_Profile_With_Terms.yaml --onshare true -d $dateAFter30Days --terms "Use it for good" > .share_Bob_Jane_Profile_With_Terms.created.yaml

    assert_success
}

@test "Accept terms of Bob to Jane Profile Share" {

    JaneShareId=$(cat .share_Bob_Jane_Profile_With_Terms.created.yaml | yq -r '.shares[0].id')
    echo "bob's share id: ${JaneShareId}"

    echo "Accept incoming share as bob"
    meeco shares:accept -y -a .Jane.yaml $JaneShareId
    assert_success
}

@test "Bob on share Alice Vehicle to Jane" {

    bobsShareId=$(cat .share_Alice_Bob.created.yaml | yq -r '.shares[0].id')
    echo "bob's share id: ${bobsShareId}"

    # we need to get the item spec
    meeco shares:get-incoming $bobsShareId -a .Bob.yaml > .shared_item_with_share_Bob.yaml
    bobsItemId=$(cat .shared_item_with_share_Bob.yaml | yq -r '.item.id')
    echo "bob's item id: ${bobsItemId}"
    meeco items:get $bobsItemId -a .Bob.yaml > .shared_alice_vehicle_item_Bob.yaml

    echo "Share bob to carol (create config)"
    meeco shares:create-config --from .Bob.yaml --connection .connection_Bob_Jane.created.yaml -i .shared_alice_vehicle_item_Bob.yaml > .onshare_Bob_Jane.yaml

    dateAFter29Days=$(date +'%Y-%m-%d' -d "29 day")
    echo "Share bob to carol (create share)"
    meeco shares:create -c .onshare_Bob_Jane.yaml -d $dateAFter29Days > .onshare_Bob_Jane.created.yaml

    assert_success

}

@test "Jane can read onshare Alice Vehicle " {

    janeShareId=$(cat .onshare_Bob_Jane.created.yaml | yq -r '.shares[0].id')
    echo "carol's share id: ${janeShareId}"

    echo "Read share as carol"
    meeco shares:get-incoming $janeShareId -a .Jane.yaml

    assert_success
}
