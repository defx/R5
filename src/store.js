export function configure({
  update = {},
  middleware = [],
  state: initialState = {},
  getState: getStateWrapper = (v) => v,
}) {
  let subscribers = []
  let state
  let onChangeCallback = () => {}

  function updateState(o) {
    state = getStateWrapper({ ...o })
    onChangeCallback(state)
  }

  updateState(initialState)

  const refs = {}

  function getState() {
    return { ...state }
  }

  function subscribe(fn) {
    subscribers.push(fn)
  }

  function updated() {
    subscribers.forEach((fn) => fn())
    subscribers = []
  }

  function onChange(fn) {
    onChangeCallback = fn
  }

  function dispatch(action) {
    const { type } = action

    if (type === "MERGE") {
      updateState({ ...getState(), ...action.payload })
    } else {
      const done = (action) => {
        if (action.type in update) {
          updateState(update[action.type](getState(), action))
        }
        return {
          then: (fn) =>
            new Promise((resolve) => {
              subscribe(() => {
                fn()
                resolve()
              })
            }),
        }
      }

      middleware[action.type]?.(action, done, {
        getState,
        dispatch,
        refs,
      }) || done(action)
    }
  }

  return {
    dispatch, // dispatch an action to the reducers
    getState, // optionally provide a wrapper function to derive additional properties in state
    onChange, // use this callback to update your UI whenever state changes
    updated, // call this once you've updated the UI so that all subscribers will be invoked and then removed
    refs, // an empty object that you can attach element refs to (supplied on object passed as the third argument to middleware functions)
  }
}
