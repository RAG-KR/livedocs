"use client";
import { ClientSideSuspense, RoomProvider } from "@liveblocks/react/suspense";
import React, { useEffect, useRef, useState } from "react";
import { Editor } from "@/components/editor/Editor";
import Header from "@/components/Header";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import ActiveCollaborators from "./ActiveCollaborators";
import { Input } from "./ui/input";
import Image from "next/image";
import { updateDocument } from "@/lib/actions/room.actions";
import Loader from "./Loader";
import ShareModal from "./ShareModal";

const CollaborativeRoom = ({roomId, roomMetadata,users, currentUserType }:CollaborativeRoomProps) => {
  const [editting, seteditting] = useState(false)
  const [loading, setloading] = useState(false)
  const [documentTitle, setDocumentTitle] = useState(roomMetadata.title || "Untitled Document");

  const updateTitleHandler = async(e:React.KeyboardEvent<HTMLInputElement>) => {
      if(e.key === "Enter"){
        setloading(true);
        try {
          if(documentTitle!==roomMetadata.title){
             const updatedDocument = await updateDocument(roomId, documentTitle);
              if(updatedDocument){
                seteditting(false);
              } 
        }} catch (error) {
          console.log("Error updating title:", error);
        }
        setloading(false);
      }
  }
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e:MouseEvent)=>{
      if(containerRef.current && !containerRef.current.contains(e.target as Node)){
        seteditting(false)
        updateDocument(roomId, documentTitle);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [roomId,documentTitle])
  
  useEffect(() => {
    if(editting && inputRef.current){
      inputRef.current.focus();
    }
  }, [editting])
  

  return (
    <RoomProvider id={roomId}>
      <ClientSideSuspense fallback={<Loader />}>
        <div className="collaborative-room">
          <Header>
            <div ref={containerRef} className="flex w-fit items-center justify-center gap-2">
              {editting &&!loading ? (
                <Input 
                type="text"
                value={documentTitle}
                ref={inputRef}
                placeholder="Enter Title"
                onChange={(e)=>setDocumentTitle(e.target.value)}
                onKeyDown={updateTitleHandler}
                disabled={!editting}
                className="document-title-input"
                />
              ):(
                <>
                <p className="document-title">{documentTitle}</p>
                </>
              )}
              {currentUserType === "editor" && !editting &&(
                <Image 
                src="/assets/icons/edit.svg"
                alt="edit"
                width={24}
                height={24}
                onClick={() => seteditting(true)}
                className="pointer"
                
                />
              )}

              {currentUserType !== "editor" && !editting &&(
                <p className="view-only-tag">View Only</p>
              )}

              {loading && <p className="text-sm text-gray-400">Saving...</p>}

            </div>
            <div className="flex w-full flex-1 justify-end gap-2 sm:gap-3">
              <ActiveCollaborators />

              <ShareModal 
              roomId={roomId}
              collaborators={users}
              creatorId={roomMetadata.creatorId}
              currentUserType={currentUserType}
              />

              <SignedOut>
                  <SignInButton />
              </SignedOut>
              <SignedIn>
                <UserButton />
              </SignedIn>
            </div>
          </Header>
          <Editor roomId={roomId} currentUserType={currentUserType} />
        </div>
      </ClientSideSuspense>
    </RoomProvider>
  );
};

export default CollaborativeRoom;
