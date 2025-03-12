import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { io } from "socket.io-client"

import toast from "react-hot-toast";

const BASE_URL="http://localhost:5001/"

export const useAuthStore = create((set,get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get('/auth/check');
      set({authUser: res.data});
      get().connectSocket();
    } catch (error) {
      console.log("Error in check auth",error.message);
      set({authUser: null})
    } finally {
      set({isCheckingAuth: false})
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup",data);
      set({ authUser: res.data });

      toast.success("Account created");
      get().connectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isSigningUp: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("Loggedout Successfully!");
      get().disconnectSocket();
    } catch (error) {
      toast.error("Something went wrong");
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });

    try {
      const res = await axiosInstance.post("/auth/login",data);
      set({ authUser: res.data });

      toast.success("Login Successful");
      get().connectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isLoggingIn: false });
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile",data);
      set({ authUser: res.data });
      toast.success("Profile Pic Updated");
    } catch (error) {
      toast.error("Something went wrong");
      console.log(error);
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if(!authUser || get().socket?.connected) return;

    const socket = io(BASE_URL,{
      query: {
        userId: authUser._id,
      }
    });
    socket.connect();
    set({ socket: socket});

    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    })
  },

  disconnectSocket: () => {
    if(get().socket?.connected) get().socket.disconnect(); 
  },

})) 