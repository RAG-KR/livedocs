'use server'

import { clerkClient } from "@clerk/nextjs/server";
import { parseStringify } from "../utils";
import { liveblocks } from "../liveblocks";

export const getClerkUser = async ({userIds}:{userIds:string[]}) => {
    try {
        const {data} = await clerkClient.users.getUserList({
            emailAddress: userIds,
        });

        const users = data.map((user) => ({
            id:user.id,
            name:`${user.firstName} ${user.lastName}`,
            email:user.emailAddresses[0]?.emailAddress,
            avatar:user.imageUrl
        }))

        //sort users based on userIds order
        const sortedUsers = userIds.map((email) => users.find((user) => user.email === email));

        return parseStringify(sortedUsers);
    } catch (error) {
        console.log("Error fetching clerk user:", error);
        
    }
}

export const getDocument = async ({roomId,userId} : {roomId:string, userId:string}) => {
try {
    const room = await liveblocks.getRoom(roomId)
    //  TODO: rbing the access thing back alter on
    // const hasAccess = Object.keys(room.usersAccesses).includes(userId)

    // if(!hasAccess){
    //     throw new Error("User does not have access to this document")
    // }

    return parseStringify(room); 
} catch (error) {
    console.log("Error fetching a room:", error);
}
}
