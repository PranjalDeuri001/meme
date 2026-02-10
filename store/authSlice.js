import { createSlice } from "@reduxjs/toolkit";

const userInfo = localStorage.getItem("userInfo")
  ? JSON.parse(localStorage.getItem("userInfo"))
  : null;

const initialState = {
  userInfo: userInfo,
  // ADDED: State to hold the currently selected device type for filtering
  selectedDeviceTypeName: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.userInfo = action.payload;
      localStorage.setItem("userInfo", JSON.stringify(action.payload));
    },
    logOut: (state) => {
      state.userInfo = null;
      // localStorage is cleared in App.jsx
    },
    // ADDED: Reducer to update the selected device type name
    setDeviceTypeName: (state, action) => {
      state.selectedDeviceTypeName = action.payload;
    },
    updateUser: (state, action) => {
      state.userInfo = { ...state.userInfo, ...action.payload };
      localStorage.setItem("userInfo", JSON.stringify(state.userInfo));
    },
  },
  // This section ensures that when logOut is dispatched, RTK Query's cache is also cleared.
  extraReducers: (builder) => {
    builder.addCase(logOut, () => {
      // console.error(state);
    });
  },
});

// EXPORTED the new action
export const { setCredentials, logOut, setDeviceTypeName, updateUser } =
  authSlice.actions;

export default authSlice.reducer;

export const selectCurrentUser = (state) => state.auth.userInfo;
