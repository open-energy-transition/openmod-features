# Open Energy Modelling Tool Feature Inventory

## Installation

1. Clone this repository
1. Install [pixi](https://pixi.sh/latest/).
1. Install all project dependencies:

   ```sh
   pixi install
   ```

## Add your tool

You can generate a configuration file for your tool using:

```sh
pixi run add-tool <tool-shortname>
```

>[!NOTE]
>We cannot accept dashes (`-`) in tool shortnames.

You will be prompted to add in your tool name, source code URL, and list of maintainers.
You can also optionally provide a documentation site URL.

## Updating your tool

### Updating features

Once your tool config file has been generated, you will find it under `tools/<tool-shortname>/`.
You will then be able to update your tool's feature list at `tools/<tool-shortname>/features.yaml`.

All tool features default to values of `n`, i.e., not available in your tool.
You should update each to a value of `y` if that feature is available and add a `source` key pointing to URL (e.g. in your documentation) in which that feature is explicitly referenced.
The `source` key is not _required_ but your feature will show as unvalidated if it is missing.

#### Adding tooltips to your configuration

You may find it useful to have descriptions for each of the features in your config.
We have referenced the config file schema as a comment at the top of the file using the [YAML language server](https://github.com/redhat-developer/yaml-language-server) syntax.
[Many IDEs have extensions](https://github.com/redhat-developer/yaml-language-server?tab=readme-ov-file#clients) to leverage this syntax to activate schema validation and support.

### Updating tool metadata

If you change your mind about any of the answers you gave when [adding your tool](#add-your-tool), you can update them by calling:

```sh
pixi run update-tool-metadata <tool-shortname>
```

### Updating tool to a new feature list

We will periodically update the feature list itself.
To update your project's current list to the newest stable feature release you can call:

```sh
pixi run update-tool <tool-shortname>
```

If you have a specific git tag/commit hash/branch of the feature list you want to update to, you can refer to that version in your call:

```sh
pixi run update-tool <tool-shortname> <version>
```

For instance:

```sh
pixi run update-tool my_tool v0.3.0
```

>[!NOTE]
>You will likely find that on updating your feature list that there are merge conflicts that you will have to resolve.
>This could happen when we change a feature name or reorganise the feature levels.
>Check the project [changelog](./CHANGELOG.md) to help decipher any merge conflicts that are unclear.