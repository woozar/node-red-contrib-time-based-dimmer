# Node-Red time based dimmer

This node allows to add a dimmer to your [node-red][1] that will be triggered by start and stop commands. It was originally designed to work with the IKEA Tradfri Switch CB10 which was connected over mqtt using zigbee2mqtt. We will ignore the "simple clicks" and only take a look at the dimming. When holding one of the keys down, it will trigger "brightness_up" or "brightness_down" and after releasing the button, it will trigger "brightness_stop".

## Install 

Run command on Node-RED installation directory.

    npm install node-red-contrib-time-based-dimmer

or run command for global installation.

    npm install -g node-red-contrib-time-based-dimmer

## Usage

The node can be used rather similar to the slider from the dashboard. It will use any numerical value it gets as its current state. The main difference is that it will also accept some commands. The keywords for the commands are configurable.

## Settings 

There are several required settings in the node. 
* Interval: the number of milliseconds between the dimming steps
* Step: the amount that will be added or substracted on every step
* MinValue: the minimum value for the dimmer. If the values gets lower than the minimum, the value will be set to the minimum and the dimming process will be stopped.
* MaxValue: the maximum value for the dimmer. If the values gets higher than the maximum, the value will be set to the maximum and the dimming process will be stopped.
* Commands: If a string is being used as input for the dimmer, the dimmer will compare the string to the commands it knows. If a command can be found, it will be triggered. 
  * Start Increase Command: The dimmer will start to increase its value
  * Stop Increase Command: The dimmer will keep its state
  * Start Decrease Command: The dimmer will start to decrease its value
  * Stop Decrease Command: The dimmer will keep its state

## For developers

If you want to add changes to the code, please feel free but it would be nice if you created a pull request if the feature would be useful to other users.

### Automated Tests

After changing anything, please make sure the tests do still execute by running:

    yarn test

Ideally you would also add tests for the changes you made.

[1]:http://nodered.org
