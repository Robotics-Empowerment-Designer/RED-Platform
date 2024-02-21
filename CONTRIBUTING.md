# Node-(RED)<sup>2</sup> contribution guidelines

## Issue reporting and feature requests
Should you find a bug or have a feature request/suggestion for enhancement, please make sure beforehand that:
- is has not already been mentioned before [here](https://github.com/Robotics-Empowerment-Designer/RED-Platform/issues).
- is not already being worked in [here](https://github.com/Robotics-Empowerment-Designer/RED-Platform/pulls).

If neither of those two are applicable feel free to create a new issue [here](https://github.com/Robotics-Empowerment-Designer/RED-Platform/issues). In order to make it easier for us to understand you please add at least the following information:
- Descriptive title
- detailed steps to reproduce the bug (including the OS and what release of our software you're running) or in case of a feature request or other form of issue a detailed description.

## Code contribution
We'd greatly appreciate it (but it is not necessary) if you would first comment on the specific issue so that we can assign you to it. When you finished your work just create a pull request so we can take a look at it. You can find more information about pull requests here: [CLI](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request?tool=cli), [Codespaces](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request?tool=codespaces), [Github Desktop](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request?tool=desktop), [Browser](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request?tool=browser).

### Adding/creating a new node
> **Note:**
> Make sure to pay attention to the comments in the specific files we mention here, as we've attached further references to the Node-RED documentation.

If you want to add a new node to Node-RED you should do the following :

- Create a copy of the [_example](./node-red/nodes/pepper/_example/) folder in [/node-red/nodes](./node-red/nodes/).
- Internationalization/Localization:
  - You are expected to include at least an english version (german would be appreciated as well, but isn't required) of any text that is shown to the user (including node help texts, configuration parameters and status information).
  - `_example/locales/<language_code>/example.json`
    - In here you should define your translated strings for configuration parameters and node status information.
    - You can find an example file [here](./node-red/nodes/pepper/_example/locales/en-US/example.json)
  - `_example/locales/<language_code>/example.html`
    - In here you should include a help text that the user will see. There you should explain what your node does, roughly how it works as well as list and explain all parameters the user has access to.
    - You can find an example file [here](./node-red/nodes/pepper/_example/locales/en-US/example.html)
  - `_example/example.html`
      > **Note:** This step is only necessary if you need to translate the node name into multiple languages.
      - Here you can localize the name of your new node by adding the `displayName` property to your language JSON file and including the following code block in the object definition for "`RED.nodes.registerType`.
      ```JavaScript
      label: function () {
          return this._(this.type + ".displayName");
      },
      paletteLabel: function () {
          return this._(this.type + ".displayName");
      },
      ```
- `_example/example.html`:
  - Replace **any** occurrence of `example` with the name of your new node.
  - Choose the best fitting category and color for your node.
  - Declare the variable that'll be used to expose parameters to the user and define reasonable default values.
  - If your node needs to have a dynamic amount of outputs, see the WaitForKeyword implementation ([[1]](./node-red/nodes/pepper/waitForKeyword/waitForKeyword.html#L151), [[2]](./node-red/nodes/pepper/waitForKeyword/waitForKeyword.js)) for more information.
  - In the [bottom script tag](./node-red/nodes/pepper/_example/example.html#L27) you need to declare the input fields for the edit dialog in which the user can edit the parameters you've specified in the `default` object.
- `_example/example.js`
  - Replace **any** occurrence of example with the name of your new node.
  - If you need to send events to the middleware/server: set your desired [event name](./node-red/nodes/pepper/_example/example.js#L11) (something like /robot/tts/say).
  - You should place your main logic inside of `node.on("input")` (e.g. your calls to our middleware).
    - You can access the parameters of the user with the `config` object.
    - Alternatively you can access *injected* values through `msg.payload`.
    - Should you choose to use both the user supplied parameters **and** injected values you will need to follow our established behaviour: the user input should always be used, only when none was given, use the injected value instead.
    - While your node (and perhaps the robot) is performing an action you should let the user know that as well with a [status text](./node-red/nodes/pepper/_example/example.js#L31).
    - To send data to our middleware you need to use [emit](./node-red/nodes/pepper/_example/example.js#L33) from our `ConnectionHelper`. You can send a single variable as is, multiple parameters should be inside an array.
  - After your node finished you need to continue the main flow with `node.send`
    - If you need to wait for the robot to finish an action use the [ConnectionHelper](./node-red/nodes/pepper/_example/example.js#L36) to listen to a specific event.
  - Make sure to include any special cleanup (e.g. stop the speech recognition) in the [RESET_NODE_STATE](./node-red/nodes/pepper/_example/example.js#L49) event.
- `package.json`
  - You need to add your node to `node-red.nodes` in the main package.json of the respective robot ([example for Pepper](./node-red/nodes/pepper/package.json))
    - It should look something like this: 
      ```JSON
      {
          "name": "node-red-contrib-pepper",
          "version": "0.1.0",
          "node-red": {
              "nodes": {
                "example": "_example/example.js"
              }
          }
      }
      ```