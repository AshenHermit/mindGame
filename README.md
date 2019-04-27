# MindGame
Multiplayer node.js application game for creating adventure stories in real time in the style of text RPG

## Installation
After downloading, you need to install using **npm** *socket.io* and *express* libraries, which appear in the *node_modules* folder

## Using
### Lan network
To connect to other players, you need connect yourself and the players with one local network.
This can be done with software to create a **VPN**.
For example, I use *Hamachi*.

### Launch
To start the server use the command:

```
node index.js [your IPv4 address]
```

For example:

```
node index.js 10.10.101.10
```

### Connecting 
To connect to the server, simply enter in the address bar of the browser: `[IPv4]:3000`
For example: `10.10.101.10:3000`

## A little about the process
In the team of players there is the first person entered the game - god, who has a preliminary plot followed by players. He is able to change all the parameters / profile of players, draw maps, and command the process of the game.
