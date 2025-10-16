# Open Energy Modelling Tool Feature Inventory

## Installation

1. Clone this repository
1. Install [pixi](https://pixi.sh/latest/).
1. Install all project dependencies:

   ```sh
   pixi install
   ```

## Add your tool

You can generate a configuration file for your tool using `pixi run add-tool <tool-shortname>`.
You will be prompted to add in your tool name, source code URL, and list of maintainers.
You can also optionally provide a documentation site URL.

Once your tool config file has been generated, you will find it under `tools/<tool-shortname>/`.
You will then be able to update your tool's feature list at `tools/<tool-shortname>/features.yaml`.

All tool features default to values of `n`, i.e., not available in your tool.
You should update each to a value of `y` if that feature is available and add a `source` key pointing to URL (e.g. in your documentation) in which that feature is explicitly referenced.
The `source` key is not _required_ but your feature will show as unvalidated if it is missing.

### Adding tooltips to your configuration

You may find it useful to have descriptions for each of the features in your config.
We have referenced the config file schema as a comment at the top of the file using the [YAML language server](https://github.com/redhat-developer/yaml-language-server) syntax.
[Many IDEs have extensions](https://github.com/redhat-developer/yaml-language-server?tab=readme-ov-file#clients) to leverage this syntax to activate schema validation and support.