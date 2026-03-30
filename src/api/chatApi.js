import { http } from '../lib/http';

export const getCourseChatRoomApi = async (courseId) => {
  const response = await http.get(`/chat/course/${courseId}/room`);
  return response.data;
};

export const getMessagesApi = async (roomId, cursor = '') => {
  const url = cursor 
    ? `/chat/${roomId}/messages?cursor=${encodeURIComponent(cursor)}`
    : `/chat/${roomId}/messages`;
  const response = await http.get(url);
  return response.data;
};
