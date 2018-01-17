---
layout: post
title: "Contributing to prettier-atom 💅"
comments: true
categories: tech open-source contributing-to
---

_"Contributing to {project}" is a series of blog posts where I highlight a helpful project I'm using and an open source contribution I made to it._

Today I'm going to talk about `prettier`, the `prettier-atom` package and how I reduced it's activation time by 75%.

## What is `prettier`?

`prettier` is an opinionated code formatter.

> Should I break this chain of function calls into multiple lines?
> Should I add a space before each bracket?

Deciding on a code format raises many mundane questions like these. In reality, the answers don't really matter. The most important thing is to decide on a format and stick to it.

Consistency.

`prettier` is exactly that - a tool for consistently formatting your code to an opinionated style.

```bash
npm install prettier
npx prettier poorly-formatted.js
# -> Outputs nicely formatted file
```

## What is `prettier-atom`?

`prettier-atom` is a package for the [atom editor](https://atom.io/) that allows you to format open files.

I really like having `prettier` in my editor because it allows me to format my files as I go. Rather than writing a bunch of code and formatting it before commit, I can see exactly what prettier is going to give me.

This also helps me be more efficient as I code. Rather than spending time writing out spaces and brackets, I can just type code freely and prettier will handle the formatting on save.

`prettier-atom` also integrates with [eslint](https://eslint.org/). That means in addition to applying a consistent format, it can also fix linting issues (it does so by running the prettier output through `eslint --fix`).

This helps reduce the number of linting issues I encounter when I go to commit.

Amaze! 🎉

## Finding issues with `prettier-atom`

As much as I love the Atom editor, it can be quite slow at times. One of the things that slows atom down is "package activation".

Whenever atom boots, it runs an `activate` function in each package. Activation allows packages to queue any initialization and get ready for use. It also blocks the editor from loading, so slow activation in a package can bring atom to a crawl.

I had been noticing some lag with atom's boot, so I opened up Timecop to see what might be causing the issue:

```
Atom -> Packages -> Timecop -> Show
```

Sure enough there were some packages taking a long time to activate - `prettier-atom` being the worst offenders.

![Prettier w/ slow activation in Timecop](/assets/posts/timecop-prettier-before.png)

This seemed like an issue. Most packages activate in < 50 ms. What would be causing `prettier-atom` to take so much time?

## Opening an issue

I'm pretty unfamiliar with atom packages - so I wanted to open an issue and get more info before trying to contribute.

Here's the repo for [prettier-atom](https://github.com/prettier/prettier-atom/).

The repo has an `ISSUE_TEMPLATE.md`. This means when you go to open an issue, the description is pre-populated with a template. The one for `prettier-atom` asks the submitter to double check the issue doesn't already exist and include output from a `prettier-atom` debug command.

I followed those instructions and [opened my issue](https://github.com/prettier/prettier-atom/issues/330).

The maintainer replied a few days later saying he'd done a bunch of things to reduce activation time, but was out of ideas. Receiving a reply that was receptive to help gave me the necessary encouragement to dig deeper.

## Collecting debug information

I did a simple google search for "Debugging Atom Packages" which led me to [this handy page on debugging atom](https://flight-manual.atom.io/hacking-atom/sections/debugging/).

Atom is basically a web application, so it has all the same debug tooling as Chrome. The article also mentioned a `--profile-startup` flag that could be used to collect performance information for the initialization stage.

I ran the following command in order to start atom and collect a profile of the startup phase.

```bash
atom --profile-startup .
```

## Analyzing profile information

This is what the profile looked like in the Chrome javascript profiler.

![Prettier javascript profile](/assets/posts/prettier-profile-full.png)

The chart shows all the function calls that happen during initialization. The length of the bar indicates how long the function ran for. The layers represent functions called from within other functions.

In other words, it's a [flame graph](http://www.brendangregg.com/FlameGraphs/cpuflamegraphs.html).

By hovering over these bars, I was able to find the one corresponding to the `prettier-atom.activate` function and dig into what was causing the slow activation time.

Looking at the chart, a few things stood out.

* Loading code adds up. Every `require` triggers a file to be read, parsed and compiled.
* One file was requiring something called `toConsumableArray` which was taking 64ms to load.
* Another file was requiring `lodash/fp` which was taking 111ms to load.

![consumable array load time](/assets/posts/consumable-array-load-time.png)
![lodash load time](/assets/posts/lodash-load-time.png)

These were both occurring from a `require`. That means it wasn't time spent computing useful stuff, it was time spent simply loading the libraries. Yuck!

If we could avoid loading these packages, we would save ~170ms from the activation time! ⚡️

## Optimization 1: Removing toConsumableArray

I noticed that the `toConsumableArray` import was coming from `babel-runtime`. Babel runtime is a collection of polyfills to allow ES6 syntax in ES5 code. I looked at the file triggering the require, and sure enough there was some fancy syntax going on.

```js
const getAllScopes = () => [
	...getJavascriptScopes(),
	...getTypescriptScopes(),
	...getCssScopes(),
	...getJsonScopes(),
	...getGraphQlScopes(),
	...getMarkdownScopes()
];
```

The `...` operator allows the arrays to be cleanly combined, but it's also not supported in ES5. So babel sees that syntax and adds `toConsumableArray` to polyfill the functionality.

It's nice syntax, but not nice enough to warrant 64ms of activation time. Converting the expression to an ES5 compatible version stopped `babel-runtime` from being included.

```js
const getAllScopes = () =>
	Array.prototype.concat(
		getJavascriptScopes(),
		getTypescriptScopes(),
		getCssScopes(),
		getJsonScopes(),
		getGraphQlScopes(),
		getMarkdownScopes()
	);
```

Sure enough, the require disappeared and the activation time reduced substantially.

## Optimization 2: Lazy loading lodash

A common pattern in nodejs code is to include all your requires at the top of the file.

Here's an example:

```js
const _ = require("lodash");

function reverseAndCompact(arr) {
	const reversed = _.reverse(arr);
	return _.compact(reversed);
}

function activate() {
	console.log("Activating!");
}
```

This is nice for keeping track of what's required, but slows down the initial load of the file. Anything that requires the above file will need to wait for `lodash` to be fully parsed before it can even see the `reverseAndCompact` function.

This is especially annoying if we just want to use the `activate` function. It doesn't depend on `lodash`, but still needs to wait for `lodash` when it's imported.

Boo!

This is more or less what was going on. One of the helper files was requiring `lodash/fp` at the top of the file, despite only 1 function actually using it (and a function that was not needed for activation).

The solution? Lazy loading!

```js
let _;

function lazyLodash() {
	_ = _ || require("lodash");
	return _;
}

function reverseAndCompact(arr) {
	const reversed = lazyLodash().reverse(arr);
	return _.compact(reversed);
}

function activate() {
	console.log("Activating");
}
```

By placing our require within a function, we stop it from being loaded when the file is required. Now when I go to import the `activate` function, there's no waiting for lodash to be required.

Those two changes saved the expected 111ms and more. Yay! 🎉

![Prettier atom startup after](/assets/posts/timecop-prettier-after.png)

## Submitting a PR

Once I had validated my fixes for the issue, I was ready to open a PR.

The `prettier-atom` repo contained a `CONTRIBUTING.md` file with instructions for opening a PR.

Some highlights from it:

* The project uses something called `nps` or "node package scripts". This means all the development scripts are run with `yarn start <script-name>`. The scripts were also defined in the `package-scripts.yml` to reduce the size of `package.json`.
* The project has an `addContributor` script. That script allows you to update the README with a link to your Github and notes about what you contributed. Such a cool way of acknowledging contributors!
* To commit you use `yarn start commit`. This starts a little cli to create your commit. The command ensures that all commits conform to a consistent style and make things like generating a `CHANGELOG` easier.

I followed the instructions, [opened a PR](https://github.com/prettier/prettier-atom/pull/335) and had my changes merged within a few days!

## Takeaways

Contributing to `prettier-atom` was a great experience. Many projects I've contributed to in the past are pretty ad-hoc and don't have a clear process for contributing. The maintainers of `prettier-atom` are very experienced open source maintainers and seeing their process taught me a lot about managing my own open source projects.

Some other learnings...

* **Profile your code:** It's amazing the optimizations you can find if you just dig a little. You can't understand the performance of your code by simply reading it. You need to run it and analyze it. I would never have guessed imports accounted for 75% of startup time.
* **Improving performance is a great contribution:** Most people aren't profiling their code, which makes it a great area to look for bugs. It's also extremely satisfying to have a measurable impact on the project.
* **Babel has a cost:** Writing code with the latest ES6 features is all the craze, but there's not much discussion about the cost of doing so. Simple things like using the `...` operator might require extra dependencies. How much are you willing to slow down your code to use the new fancy syntax?
* **Open source is a great way to learn about project management:** Seeing the amount of tooling and documentation that existed for `prettier-atom` was really inspiring. Having a command to update your contributors list? For generating a release? For creating consistent commits? These are things I'd never really seen. It's a great lesson in making projects beginner friendly and easy to setup. These things are easy to gloss over, but provide a lot of value in the long run.

I'm going to continue looking for ways to speed up my atom activation 😊.

_Thanks to @cqfd and @vaibhavsagar for helping me make this post prettier 💅._
