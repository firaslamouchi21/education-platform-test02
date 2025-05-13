import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { auth } from '../../config/firebase';

interface ChatMessage {
  id: string;
  message: string;
  sender_id: number;
  sender_email: string;
  sender_role: string;
  timestamp: any;
}

interface ChatState {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
}

const initialState: ChatState = {
  messages: [],
  loading: false,
  error: null,
};

export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async (courseId: number, { rejectWithValue }) => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/chat/${courseId}`,
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ courseId, message }: { courseId: number; message: string }, { rejectWithValue }) => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/chat/${courseId}`,
        { message },
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteMessage = createAsyncThunk(
  'chat/deleteMessage',
  async ({ courseId, messageId }: { courseId: number; messageId: string }, { rejectWithValue }) => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/chat/${courseId}/messages/${messageId}`,
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );
      return messageId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    clearMessages: (state) => {
      state.messages = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.messages = action.payload;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.messages.push(action.payload);
      })
      .addCase(deleteMessage.fulfilled, (state, action) => {
        state.messages = state.messages.filter(
          (message) => message.id !== action.payload
        );
      });
  },
});

export const { clearError, addMessage, clearMessages } = chatSlice.actions;
export default chatSlice.reducer; 