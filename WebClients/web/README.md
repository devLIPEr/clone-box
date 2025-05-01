## What you will use

This Single Page App is built using [SolidJS](https://docs.solidjs.com/) as the JavaScript/TypeScript framework and [tailwindcss](https://tailwindcss.com/docs/installation/using-vite) to style the UI.

## Usage

Those templates dependencies are maintained via [pnpm](https://pnpm.io) via `pnpm up -Lri`.

This is the reason you see a `pnpm-lock.yaml`. That being said, any package manager will work. This file can be safely be removed once you clone a template.

```bash
$ npm install # or pnpm install or yarn install
```

### Learn more on the [Solid Website](https://solidjs.com) and come chat with us on our [Discord](https://discord.com/invite/solidjs)

## Available Scripts

In the project directory, you can run:

### `npm run dev` or `npm start`

Runs the app in the development mode.`<br>`
Open [http://localhost:443](http://localhost:443) to view it in the browser.

The page will reload if you make edits.`<br>`

### `npm run build`

Builds the app for production to the `dist` folder.`<br>`
It correctly bundles Solid in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.`<br>`
Your app is ready to be deployed!

## Deployment

You can deploy the `dist` folder to any static host provider (netlify, surge, now, etc.)

## Making new games

For each new game you create, you will need to create a file for it in the views directory and add its class at index.tsx as a Route.`<br>`
Every game UI should have:

```
<Header username={username} dark="#233745" light="#FFB343"/>
<Show when={id === 0 && !started()}>
    <Start ws={ws} dark="#233745" secondary="#3C6987"/>
</Show>
```

This creates the default interface of any of the games present in this repository, a header with the username and for the host it also shows a button to start the game whenever it is possible.

The logic to show the interfaces is handled by the commands the user websocket receive, the current state change and the UI renders what is needed.
