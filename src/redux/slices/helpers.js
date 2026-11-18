/** Standard loading state for one async resource. */
export const resourceState = (data = null) => ({ data, status: 'idle', error: null });

/** Wires pending/fulfilled/rejected of a thunk to a resource in state. */
export const addResourceCases = (builder, thunk, key, select = (payload) => payload) => {
  builder
    .addCase(thunk.pending, (state) => {
      state[key].status = 'loading';
      state[key].error = null;
    })
    .addCase(thunk.fulfilled, (state, action) => {
      state[key].status = 'succeeded';
      state[key].data = select(action.payload, state[key].data);
    })
    .addCase(thunk.rejected, (state, action) => {
      state[key].status = 'failed';
      state[key].error = action.payload?.message || 'Something went wrong';
    });
};

export const stripMeta = ({ __message, ...rest }) => rest; // eslint-disable-line no-unused-vars
