"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { database } from '@/lib/firebase';
import { ref, get, set, serverTimestamp } from 'firebase/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import useLocalStorage from '@/hooks/use-local-storage';
import { generateSuggestedUsername } from '@/ai/flows/generate-suggested-username';
import { Loader2, Wand2, Users, LogIn } from 'lucide-react';

export function RoomSetup() {
  const router = useRouter();
  const { toast } = useToast();
  const [username, setUsername] = useLocalStorage('chess-username', '');
  const [roomId, setRoomId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateUsername = async () => {
    setIsGenerating(true);
    try {
      const result = await generateSuggestedUsername({});
      if (result && result.username) {
        setUsername(result.username);
        toast({
          title: "Username Generated!",
          description: `We've suggested "${result.username}" for you.`,
        });
      }
    } catch (error) {
      console.error('Error generating username:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not generate a username. Please try again.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const validateInputs = () => {
    if (!username.trim()) {
      toast({
        variant: 'destructive',
        title: 'Username Required',
        description: 'Please enter a username to play.',
      });
      return false;
    }
    return true;
  };

  const createRoom = async () => {
    if (!validateInputs()) return;
    setIsLoading(true);

    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const roomRef = ref(database, `rooms/${newRoomId}`);

    try {
      await set(roomRef, {
        createdAt: serverTimestamp(),
        players: { white: username, black: null },
        game: {
          fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
          history: [],
          status: 'Waiting for opponent',
          turn: 'w',
        },
      });
      localStorage.setItem('chess-room', newRoomId);
      router.push(`/play/${newRoomId}`);
    } catch (error) {
      console.error('Error creating room:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to Create Room',
        description: 'Please check your connection and try again.',
      });
      setIsLoading(false);
    }
  };

  const joinRoom = async () => {
    if (!validateInputs() || !roomId.trim()) {
      toast({
        variant: 'destructive',
        title: 'Room ID Required',
        description: 'Please enter a Room ID to join.',
      });
      return;
    }
    setIsLoading(true);
    const roomRef = ref(database, `rooms/${roomId.toUpperCase()}`);

    try {
      const snapshot = await get(roomRef);
      if (snapshot.exists()) {
        const roomData = snapshot.val();
        
        // Check for room expiry (1 hour)
        const oneHour = 60 * 60 * 1000;
        if (Date.now() - roomData.createdAt > oneHour) {
          toast({ variant: 'destructive', title: 'Room Expired', description: 'This room is over an hour old and has expired.' });
          set(roomRef, null); // Clean up expired room
          setIsLoading(false);
          return;
        }

        // Assign player to an empty slot
        if (roomData.players.white === null || roomData.players.white === username) {
          await set(ref(database, `rooms/${roomId.toUpperCase()}/players/white`), username);
        } else if (roomData.players.black === null || roomData.players.black === username) {
          await set(ref(database, `rooms/${roomId.toUpperCase()}/players/black`), username);
        } else {
           toast({ variant: 'destructive', title: 'Room Full', description: 'This room is already full.' });
           setIsLoading(false);
           return;
        }

        localStorage.setItem('chess-room', roomId.toUpperCase());
        router.push(`/play/${roomId.toUpperCase()}`);
      } else {
        toast({
          variant: 'destructive',
          title: 'Room Not Found',
          description: `Room with ID "${roomId.toUpperCase()}" does not exist.`,
        });
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error joining room:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to Join Room',
        description: 'Please check the Room ID and your connection.',
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4 bg-background">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline text-center">Welcome to ChessCraft</CardTitle>
          <CardDescription className="text-center pt-2">Create a new game or join an existing one.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-base">Username</Label>
            <div className="flex gap-2">
              <Input
                id="username"
                placeholder="Enter your name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleGenerateUsername}
                disabled={isLoading || isGenerating}
                aria-label="Generate Username"
              >
                {isGenerating ? <Loader2 className="animate-spin" /> : <Wand2 />}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="room-id" className="text-base">Room ID (to join)</Label>
            <Input
              id="room-id"
              placeholder="Enter Room ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              disabled={isLoading}
              className="uppercase"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-6"
            onClick={createRoom}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="animate-spin" /> : <Users />}
            Create New Room
          </Button>
          <Button
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-lg py-6"
            onClick={joinRoom}
            disabled={isLoading || !roomId}
          >
            {isLoading ? <Loader2 className="animate-spin" /> : <LogIn />}
            Join Room
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
