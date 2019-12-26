# Node-Red time based dimmer

This node allows to add a dimmer that will be triggered by start and stop commands. It was originally designed to work with the IKEA Tradfri Switch CB10 which was connected over mqtt using zigbee2mqtt. The switch has two buttons that can either be clicked or held. When (short) clicking the buttons they will trigger the "on" or "off" command but when holding them down, they will trigger "brightness_up" or "brightness_down" and after releasing them, the command will be "brightness_stop".

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
