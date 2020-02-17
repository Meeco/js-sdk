#!/bin/sh

# Private NPMRC used to install the api SDKs

# Decrypt the file
# --batch to prevent interactive command --yes to assume "yes" for questions
gpg --quiet --batch --yes --decrypt --passphrase="$NPMRC_DECRYPTION_PASSPHRASE" \
--output ./.npmrc .npmrc.gpg