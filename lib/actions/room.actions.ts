'use server';
import {nanoid} from 'nanoid';
import { liveblocks } from '../liveblocks';
import { revalidatePath } from 'next/cache';
import { getAccessType, parseStringify } from '../utils';
import { redirect } from 'next/navigation';


export const createDocument = async({ userId, email}:CreateDocumentParams) => {
    const roomId = nanoid();

    try {
        const metadata = {
            creatorId:userId,
            email,
            title:'Untitled', 
        }

        const usersAccesses : RoomAccesses = {
            [email]:['room:write'] 
        }

        const room = await liveblocks.createRoom(roomId,{
            metadata,
            usersAccesses,
            defaultAccesses:[]
        })
        revalidatePath('/')
        return parseStringify(room);
    } catch (error) {
        console.log("Error creating document:", error);
        
    }
}

export const getDocument = async ({ roomId, userId }: { roomId: string; userId: string }) => {
  try {
      const room = await liveblocks.getRoom(roomId);
      const hasAccess = Object.keys(room.usersAccesses).includes(userId);
    
      if(!hasAccess) {
        throw new Error('You do not have access to this document');
      }

      return parseStringify(room);
  } catch (error) {
    console.log(`Error happened while getting a room: ${error}`);
  }
}

export const updateDocument = async (roomId:string, title:string) => {
    try {
        const updatedRomm = await liveblocks.updateRoom(roomId, {
            metadata: {
                title
            }
        });

        revalidatePath(`/documents/${roomId}`);

        return parseStringify(updatedRomm);
    } catch (error) {
        console.log("Error updating document:", error);
    }
}

export const getDocuments = async (email :string) => {
  try {
      const rooms = await liveblocks.getRooms({userId:email});

      return parseStringify(rooms);
  } catch (error) {
    console.log(`Error happened while getting rooms: ${error}`);
  }
}

export const updateDocumentAccess = async ({roomId, email, userType, updatedBy}:ShareDocumentParams) => {
    try {
        const usersAccesses: RoomAccesses = {
            [email]: getAccessType(userType) as AccessType,
        }

        const room = await liveblocks.updateRoom(roomId, {
            usersAccesses,
        });

        if(room){
            //TODO: SEND A NOTIF TO THE USER
            const notificationId = nanoid();
            await liveblocks.triggerInboxNotification({
                userId: email,
                kind:'$documentAccess' ,
                subjectId:notificationId,
                activityData:{
                    userType,
                    title:`you have been added as a ${userType} access to a document by ${updatedBy.name}`,
                    updatedBy:updatedBy.name,
                    avatar:updatedBy.avatar,
                    email:updatedBy.email
                },
                roomId
        })
        }
        revalidatePath(`/documents/${roomId}`); 
        return parseStringify(room);
    } catch (error) {
        console.log(`Error happend when updating the room access: ${error}`);
    }
}

export const removeColloborator = async ({roomId , email}: {roomId: string; email: string}) => {
    try {
        const room = await liveblocks.getRoom(roomId);
        if(room.metadata.emai === email){
            throw new Error("Owner cannot be removed from the document");
        }

        const updatedRoom = await liveblocks.updateRoom(roomId, {
            usersAccesses: {
                [email]: null
            }
        });

        revalidatePath(`/documents/${roomId}`);
        return parseStringify(updatedRoom);

    } catch (error) {
        console.log(`Error removing collaborator: ${error}`);
    }
}

export const deleteDocument = async (roomId:string) => {
    try {
        await liveblocks.deleteRoom(roomId);
        revalidatePath('/');
        redirect('/');
    } catch (error) {
        console.log("Error deleting document:", error);
    }
}
