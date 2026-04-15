import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import groupReducer from "../features/groups/groupSlice";
import chatReducer from "../features/chat/chatSlice";
import notesReducer from "../features/notes/notesSlice";
import kuppiReducer from "../features/kuppi/kuppiSlice";
import notificationsReducer from "../features/notifications/notificationsSlice";
import meetupReducer from "../features/meetups/meetupSlice";
import pollReducer from "../features/polls/pollSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    groups: groupReducer,
    chat: chatReducer,
    notes: notesReducer,
    kuppi: kuppiReducer,
    notifications: notificationsReducer,
    meetups: meetupReducer,
    polls: pollReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
