#!./test/libs/bats/bin/bats

load 'libs/bats-support/load'
load 'libs/bats-assert/load'

set -e
shopt -s expand_aliases
alias meeco="node --require tsconfig-paths/register ./bin/run"


@test "Create user Alice and retrieve user login detail" {
    meeco users:create -p supersecretpassword > .Alice.yaml
    assert [ -e '.Alice.yaml' ]

    meeco users:login -p supersecretpassword -a .Alice.yaml > .Alice_login.yaml

    cat .Alice.yaml
    cat .Alice_login | assert_output
}

@test "Create a 'Esafe Vehicle' item template for Alice" {
    meeco items:create-config vehicle -a .Alice.yaml > .template_vehicle.yaml

    # slot 0 left empty on purpose
    cat .template_vehicle.yaml |
    yq -y '(.spec.label) = "My Vehicle"'|
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

@test "Create user Bob and retrieve user login detail" {

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

@test "Share Alice Vehicle Item with Bob" {
    # note: shared item must include an empty slot!
    dateAFter30Days=$(date +'%Y-%m-%d' -d "30 day")

    echo "Share alice to bob"
    meeco shares:create-config --from .Alice.yaml --connection .connection_Alice_Bob.created.yaml -i .vehicle_alice.yaml > .share_Alice_Bob.yaml
    meeco shares:create -c .share_Alice_Bob.yaml --onshare true -d $dateAFter30Days > .share_Alice_Bob.created.yaml

    assert_success
}

@test "Share Alice vehicle single slot with Bob" {
    cat .template_vehicle.yaml |
    yq -y '(.spec.label) = "Other Vehicle"'|
    yq -y '(.spec.slots[0].value) = "20000101"' |
    yq -y '(.spec.slots[1].value) = "ABC123"' |
    yq -y '(.spec.slots[2].value) = "Mazda"' |
    yq -y '(.spec.slots[3].value) = "Familia"' |
    yq -y '(.spec.slots[4].value) = "VIN3322112223"' > .template_alice_second_vehicle.yaml

    meeco items:create -i .template_alice_second_vehicle.yaml -a .Alice.yaml > .second_vehicle_alice.yaml
    assert_success

    dateAFter30Days=$(date +'%Y-%m-%d' -d "30 day")

    echo "Share alice to bob"
    meeco shares:create-config --from .Alice.yaml --connection .connection_Alice_Bob.created.yaml -i .second_vehicle_alice.yaml -s vin > .share_Alice_Bob_Single_Slot_vin.yaml
    meeco shares:create -c .share_Alice_Bob_Single_Slot_vin.yaml --onshare true -d $dateAFter30Days
    assert_success
}

@test "Create user Jane" {

    echo "Create user 'Jane'"
    meeco users:create -p supersecretpassword > .Jane.yaml
    assert [ -e '.Jane.yaml' ]
}

@test "Create Connection from Bob to Jane" {
    echo "Setup a connection from 'Bob' to 'Jane'"
    meeco connections:create-config --from .Bob.yaml --to .Jane.yaml > .connection_Bob_Jane.yaml
    meeco connections:create -c .connection_Bob_Jane.yaml > .connection_Bob_Jane.created.yaml
    assert_success
}

@test "Create Share Bob to Jane with terms and conditions" {
    meeco items:create -i .template_updated_alice_vehicle.yaml -a .Bob.yaml > .vehicle_bob.yaml
    assert_success

    dateAFter30Days=$(date +'%Y-%m-%d' -d "30 day")

    echo "Share Bob to Jane"
    meeco shares:create-config --from .Bob.yaml --connection .connection_Bob_Jane.created.yaml -i .vehicle_bob.yaml > .share_Bob_Jane_With_Terms.yaml
    meeco shares:create -c .share_Bob_Jane_With_Terms.yaml --onshare true -d $dateAFter30Days --terms "Use it for good" > .share_Bob_Jane_With_Terms.created.yaml

    assert_success
}

@test "Accept terms of Bob to Jane Share" {

    JaneShareId=$(cat .share_Bob_Jane_With_Terms.created.yaml | yq -r '.shares[0].id')
    echo "Bob's share id: ${JaneShareId}"

    echo "Accept incoming share as Jane"
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

    echo "Share bob to Jane (create config)"
    meeco shares:create-config --from .Bob.yaml --connection .connection_Bob_Jane.created.yaml -i .shared_alice_vehicle_item_Bob.yaml > .onshare_Bob_Jane.yaml

    dateAFter29Days=$(date +'%Y-%m-%d' -d "29 day")
    echo "Share bob to Jane (create share)"
    meeco shares:create -c .onshare_Bob_Jane.yaml -d $dateAFter29Days > .onshare_Bob_Jane.created.yaml

    assert_success

}

@test "Jane can read onshare Alice Vehicle " {

    janeShareId=$(cat .onshare_Bob_Jane.created.yaml | yq -r '.shares[0].id')
    echo "Jane's share id: ${janeShareId}"

    echo "Read share as Jane"
    meeco shares:get-incoming $janeShareId -a .Jane.yaml

    assert_success
}
