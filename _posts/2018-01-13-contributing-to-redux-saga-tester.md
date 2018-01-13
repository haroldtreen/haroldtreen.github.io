---
layout: post
title: "Contributing to redux-saga-tester ⚛️"
comments: true
categories: tech open-source contributing-to
---

Hello internet! It's been a while.

I've been getting back into open source recently by contributing to some libraries I use.  
When it comes to open source there seems to be a lot of questions:

> How do I find a project to contribute to?  
> How do I find an issue to work on?  
> How do I open a PR without looking like a n00b? I don't want to look like a n00b! 😭

So I thought it would be fun to turn my OS contributions into blog posts!
Hopefully it can inform people about cool libraries and the process of becoming project contributor.

So without further ado, I present...

<h2 align="center">The <i>"Contributing to {project}"</i> Series! 🎉</h2>

In today's edition:

## Contributing to `redux-saga-tester`

`redux-saga-tester` is a library to simplify testing redux sagas.

> ...???

Alright... that might not mean anything to anyone. Let's take a step back...

(Or [skip ahead](#what-is-redux-saga-tester) if I'm preaching to the choir!)

### What is Redux?

Redux is a state management library for javascript. It allows you to take all the state in your application and centralize it to one spot. It also enforces consistent conventions for reading and updating that state.

The heart of redux is called the `store`. All reading and writing to the state is done through the store.

```js
import createStore from "redux";
import reducer from "./reducer";

const store = createStore(reducer);
```

In redux, state mutations are done by dispatching an `action` to the store. An action is a plain javascript object describing a change:

```js
const action = {
	type: "ADD_TODO",
	id: 10,
	description: "Use Redux"
};

store.dispatch(action);
```

Actions are taken by redux and handed off to a `reducer` (that thing we passed `createStore` above).
A reducer is a pure function that takes the current state, an action and returns new state.

```js
const initialState = { todos: [] };

function todoReducer(state = initialState, action) {
	switch (action.type) {
		case "ADD_TODO":
			const newTodo = {
				id: action.id,
				description: action.description
			};
			return { ...state, todos: state.todos.concat(newTodo) };
		default:
			return state;
	}
}

const state = { todos: [] };
const newState = todoReducer(state, action);
// -> { todos: [{ id: 10, description: "Use Redux"}] }
```

Your application can then `subscribe` to the store and render the new state.

```jsx
class TodoList extends React.Component {
	render() {
		return (
			<ul>
				{this.props.todos.map(todo => (
					<li key={todo.id}>{todo.description}</li>
				))}
			</ul>
		);
	}
}

reduxStore.subscribe(() => {
	const state = reduxStore.getState();
	React.render(
		<TodoList todos={state.todos} />,
		document.getElementById("app")
	);
});
```

That's all you really need to know!

Here's a link to the [docs](https://redux.js.org/) in case you want to dig deeper.

### What is `redux-saga`?

Cool! So `redux` is this thing that:

1. Accepts `actions` (plain javascript objects)
1. Passes them to a `reducer` (plain javascript function)
1. And returns the new state (plain javascript object)

This model works great for synchronous state changes...

> I have a todo! Add it to my state plz!

But it doesn't really work great for asynchronous state changes...

> Make a network request for my todos! Show an error if the request fails!

Enter `redux-sagas`, a redux middleware.

Reducers listen for actions with a certain `type` and perform synchronous updates to the state.  
Sagas are generator functions that listen for actions with a certain `type` and perform asynchronous updates to the state.

You might have a `fetchTodosSaga` that listens for a `FETCH_TODOS` action and handles the necessary network requests.

```js
function* fetchTodos(action) {
	try {
		const todos = yield call(Api.fetchTodos);
		yield put({ type: "FETCH_TODOS_SUCCEEDED", todos });
	} catch (e) {
		yield put({ type: "FETCH_TODOS_FAILED", message: e.message });
	}
}

function* fetchTodosSaga() {
	yield takeLatest("FETCH_TODOS", fetchTodos);
}
```

(`takeLatest` and `put` are just functions to listen for actions and dispatch other actions)

This is nice because we can trigger complex behavior with actions along with update the state.

...Once again, you can find much more info in the [docs](https://redux-saga.js.org/).

### What is redux-saga-tester?

Great! So redux and redux-sagas allow us to centralize all our state storage and management.

But now that we have all this logic in sagas... how do we test it?

According to the `redux-saga` [docs](https://redux-saga.js.org/docs/advanced/Testing.html), by calling the saga and inspecting the yielded values.

```js
it("fetches the todos", () => {
	const generator = fetchTodos();
	const todos = [];
	expect(generator.next().value).toEqual(call(Api.fetchTodos));
	expect(generator.next(todos).value).toEqual(
		put({ type: "FETCH_TODOS_SUCCEEDED", todos })
	);
});
```

But this is not ideal...

* What if we add an intermediate yields between the first API call and the dispatched action?
* What if the order values are yielded changes?
* What if we have a lot of steps in our saga?

These types of tests end up being long and fragile (any change to the saga offsets everything and breaks the test).

In reality, we don't really care all the nitty gritty details of what our `fetchTodos` saga is doing.

Does it log stuff? Does it dispatch other actions? What are the order of those?

> ¯\\\_(ツ)\_/¯

What we care is:

* It runs when we dispatch `FETCH_TODOS`.
* A network call is made for todos (or our API library is called).
* The returned todos end up in the store.

So something like this:

```js
it("fetches the todos", async () => {
	const todos = [];
	sinon.stub(Api, "fetchTodos").resolves(todos);

	const sagaTester = new SagaTester();
	sagaTester.run(fetchTodosSaga);
	sagaTester.dispatch({ type: "FETCH_TODOS" });
	await sagaTest.waitFor("FETCH_TODOS_SUCCEEDED");

	expect(sagaTester.getState().todos).toEqual(todos);
	expect(Api.fetchTodos.called).toBeTrue();
});
```

This setup is much nicer.

* We're using the saga the same way it will run in our application.
* The test describes behavior instead of implementation details.
* Our test is less likely to break due to minor changes to the saga.

The second setup is what's enabled by `redux-saga-tester`. It allows you to run your sagas to completion and observe the resulting actions and state changes.

### Finding issues in `redux-saga-tester`

`redux-saga-tester` is a library I discovered after becoming frustrated with the recommended testing strategy.

Originally when I read the docs for `redux-saga` and "How To Test", it simply read:

```
WIP
```

[Not super helpful...](https://github.com/redux-saga/redux-saga/blob/2013a1f2fd2abafb5bc30a0c37b92b6d4c695882/docs/advanced/Testing.md)

> How can they recommend these patterns without also understanding the testing implications?!

I began googling around and eventually found a [github comment](https://github.com/redux-saga/redux-saga/issues/518) by the creator of `redux-saga-tester` describing their workaround. Switching to `redux-saga-tester` instantly made my tests simpler and more robust.

But while writing tests with `redux-saga-tester` there was a strange error I would run into.

```
Timeout - Async callback was not invoked within timeout specified.
```

> Wahhh? 😰

It turned out to be caused by the `waitFor` method.

```js
it("waitFor might never resolve", async () => {
	const sagaTester = new SagaTester();

	sagaTester.run(fetchTodosSaga);
	await sagaTester.waitFor("THIS_ACTION_WILL_NEVER_DISPATCH"); // Boom 💥
});
```

`waitFor` allows the saga to run and resolves when a certain type of action is seen.

Unfortunately, `waitFor` would not resolve if the action never occurred. The saga might run to completion, but the `waitFor` would never get resolved.

This was annoying for a few reasons:

* The error was a timeout, so the test suite would hang for 5 seconds failing.
* The error was extremely unhelpful (`timeout` provides no indication what went wrong).

I [opened an issue](https://github.com/wix/redux-saga-tester/issues/32) on the repo which received a few responses from others also experiencing the issue. Normally I'd wait for the maintainer to comment before moving forward with a fix, but enough people seemed effected that I decided to work on it.

### Fixing the issue and opening a PR

For the longest time I let the issue sit.

> I don't want to dig through the internals to figure out how it works. It's probably complicated.

Eventually I realized that the first step to fixing the issue wasn't "learn how everything works". It was simply "write a test that demonstrates the issue".

Luckily the library had a nice test suite. I was able to capture the issue with a simple test.

```js
it("Rejects if saga completes without emitting awaited action", () => {
	const sagaTester = new SagaTester({});
	const NON_EMITTED_ACTION = "NON_EMITTED_ACTION";
	const emptySaga = function*() {
		yield;
	};
	sagaTester.run(emptySaga);
	const wait = sagaTester.waitFor(NON_EMITTED_ACTION);

	return expect(wait).to.be.rejectedWith(Error, NON_EMITTED_ACTION);
});
```

Once there was something exposing the issue, working on a fix was much easier. I could read through the code, add console statements and inspect what was being run with my test. That was all the momentum I needed in order to implement a fix.

Turns out that running a saga creates a promise to alert when it's complete. Nothing was listening for that completion, so I added a callback to verify the awaited actions.

```js
function _verifyAwaitedActionsCalled() {
	Object.keys(this.actionLookups).forEach(actionType => {
		const action = this.actionLookups[actionType];
		if (action.count === 0 && action.reject) {
			action.reject(
				new Error(actionType + " was waited for but never called")
			);
		}
	});
}

task.done.then(() => this._verifyAwaitedActionsCalled());
```

Whenever `waitFor` is called, it saves the promise in the `actionLookups` object. This object also stores the number of times that action was dispatched. My function looked for actions with no dispatches and rejected their unresolved promises.

This got my test passing! Yay! 🙌

I pushed the change to my fork and [opened a PR](https://github.com/wix/redux-saga-tester/pull/43).

`redux-saga-tester` doesn't have a `CONTRIBUTING.md` or a `PULL_REQUEST_TEMPLATE.md`, so I just ensured my commit history was minimal, the commit messages were clear and my pull request was well explained.

A few days later the maintainer merged the change after some additional testing 🎉.

### Updating the README

While working through this issue, I was surprised to discover some additional functionality that wasn't documented. The README contained some usage examples, but gave no overview of the API.

Having to read the code to learn about everything was not ideal, so I added a more formal API to the README. Once it seemed to match the source files, I [opened a PR for that](https://github.com/wix/redux-saga-tester/pull/44).

It was merged with no additional comments 😊.

You can view that API [here](https://github.com/wix/redux-saga-tester#api).

### Takeaways

* **Test behavior, not implementation:** Seeing the tests for redux-saga made it extremely clear why testing implementation is a bad idea. Tests become extremely flakey! If your tests are too coupled to your implementation, it may be a sign to test at a higher level. `redux-saga-tester` allows for testing at a higher level where you don't need to think about implementation details.
* **Open Issues:** It takes very little effort and is the first step to discovering whether others want a fix and if the maintainer is responsive.
* **Start with a test:** Digging through source files can be very intimidating if you don't know the project. Writing a test is a great way to expose the issue and provide a path to implementing a fix.
* **Improve the project:** As a new contributor you have insights into the project that the maintainers don't have. Is this project easy to understand? Easy to contribute to? Is there any documentation missing? Once you've got your feet in the water, you'll likely be able to spot other things that can be improved... improve them!

So there you go! A fun open source contribution I made over a weekend.

Now go forth and contribute to a library that you're using!

_Thanks to @cqfd, @jimjshields and @vaibhavsagar for thoughts and feedback!_ 😊
