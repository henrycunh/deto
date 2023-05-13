# deto

> Create pull request description automatically from file changes

## install

```sh
npm i -g deto
```

## usage

You need an OpenAI API key. You can get one [here](https://platform.openai.com/account/api-keys) and set as the `OPENAI_API_KEY` environment variable.

Then just run
```sh
deto
```

Or you can use `npx`:

```sh
npx deto
```

## options

### templating
```sh
deto -t "Use the template ## what, ## why, ## how"
```

### number of commits
```sh
deto --last 4
```
<sup><strong>This will use only the last commits for the summarization</strong></sup>
