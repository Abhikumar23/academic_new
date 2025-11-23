import { combineReducers } from "@reduxjs/toolkit"

import authReducer from "../slices/authSlice"
import cartReducer from "../slices/cartSlice"
import courseReducer from "../slices/courseSlice"
import profileReducer from "../slices/profileSlice"
import viewCourseReducer from "../slices/viewCourseSlice"

const rootReducer = combineReducers({
  auth: authReducer,
  profile: profileReducer,  // here we combine all the reducers as rootReducers and then we pass it in single form in index.js
  course: courseReducer,     // the we create slices for all these rootReducers.
  cart: cartReducer,
  viewCourse: viewCourseReducer,
})

export default rootReducer
