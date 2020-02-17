## Config Files

The Meeco CLI primarily accepts its input in the form Yaml config files.

Each type of file read should have an associated config model associated with it. This serves to standardise the way the Yaml is read, affords a degree of type safety and, in future, allow for some form of validation.

Each of these models has a number of static methods for parsing and creating config Yaml. The only one of these that all models will have is `fromYamlConfig` which is the standard method to call after reading and parsing Yaml from a file.

Commands that serve the purpose of scaffolding these config files should be in the form `<model>:create-config`
