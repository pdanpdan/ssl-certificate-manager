export function SET_LIST(state, list) {
  state.list = Array.isArray(list) ? list : [];
}
