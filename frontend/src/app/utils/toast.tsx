import React from "react";
import { Platform, Alert } from "react-native";
import { toast } from "react-hot-toast";

export const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
  if (Platform.OS === "web") {
    // Use a custom renderer to make the whole toast dismissible on click
    toast((t) => (
      <div 
        onClick={() => toast.dismiss(t.id)}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px',
          cursor: 'pointer',
          width: '100%',
          userSelect: 'none'
        }}
      >
        <span style={{ fontSize: '18px' }}>
          {type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
        </span>
        <span style={{ flex: 1 }}>{message}</span>
      </div>
    ), {
      id: message,
      duration: 4000,
    });
  } else {
    const title = type.charAt(0).toUpperCase() + type.slice(1);
    Alert.alert(title, message);
  }
};
