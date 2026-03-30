import apiClient from './axios';

export const getCourseChatRoomApi = async (courseId) => {
  const response = await apiClient.get(`/chat/course/${courseId}/room`);
  return response.data;
};

export const getMessagesApi = async (roomId, cursor = '') => {
  const url = cursor 
    ? `/chat/${roomId}/messages?cursor=${encodeURIComponent(cursor)}`
    : `/chat/${roomId}/messages`;
  const response = await apiClient.get(url);
  return response.data;
};
