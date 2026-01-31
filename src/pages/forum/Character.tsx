import { useState } from 'react';
import { Shirt, Palette, Sparkles } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function Character() {
  return (
    <div className="min-h-screen bg-[hsl(var(--bc-bg))]">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[hsl(var(--bc-text))] mb-2">Character</h1>
          <p className="text-[hsl(var(--bc-text-muted))]">Customize your avatar and show off your unique style!</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Avatar Display */}
          <div className="lg:col-span-2">
            <Card className="bg-[hsl(var(--bc-bg-card))] border-[hsl(var(--bc-border))] overflow-hidden">
              <CardHeader className="border-b border-[hsl(var(--bc-border))]">
                <CardTitle className="text-[hsl(var(--bc-text))]">Avatar Preview</CardTitle>
                <CardDescription>Your current look</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[500px] bg-gradient-to-b from-[hsl(var(--bc-bg-light))] to-[hsl(var(--bc-bg))] flex items-center justify-center">
                  {/* Static Avatar Display */}
                  <div className="relative">
                    {/* Avatar Body - Simple block character style */}
                    <div className="relative w-40 h-64 flex flex-col items-center">
                      {/* Head with face */}
                      <div className="relative w-24 h-24 bg-[#f5d0a9] rounded-lg shadow-lg overflow-hidden">
                        {/* Face overlay */}
                        <img 
                          src="/textures/face.png" 
                          alt="Face"
                          className="absolute inset-0 w-full h-full object-contain"
                        />
                      </div>
                      
                      {/* Neck */}
                      <div className="w-8 h-4 bg-[#f5d0a9]" />
                      
                      {/* Torso */}
                      <div className="w-20 h-24 bg-[hsl(var(--bc-primary))] rounded-t-sm flex items-center justify-center">
                        <span className="text-white text-xs font-bold">BLOX</span>
                      </div>
                      
                      {/* Arms */}
                      <div className="absolute top-28 left-0 w-6 h-20 bg-[hsl(var(--bc-primary))] rounded-b-lg" />
                      <div className="absolute top-28 right-0 w-6 h-20 bg-[hsl(var(--bc-primary))] rounded-b-lg" />
                      
                      {/* Hands */}
                      <div className="absolute top-44 -left-1 w-8 h-6 bg-[#f5d0a9] rounded" />
                      <div className="absolute top-44 -right-1 w-8 h-6 bg-[#f5d0a9] rounded" />
                      
                      {/* Legs */}
                      <div className="flex gap-2">
                        <div className="w-8 h-20 bg-[#3b5998] rounded-b-lg" />
                        <div className="w-8 h-20 bg-[#3b5998] rounded-b-lg" />
                      </div>
                      
                      {/* Feet */}
                      <div className="flex gap-2 -mt-1">
                        <div className="w-10 h-4 bg-[#333] rounded" />
                        <div className="w-10 h-4 bg-[#333] rounded" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Customization Panel */}
          <div className="space-y-6">
            <Card className="bg-[hsl(var(--bc-bg-card))] border-[hsl(var(--bc-border))]">
              <CardHeader>
                <CardTitle className="text-[hsl(var(--bc-text))] flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[hsl(var(--bc-accent))]" />
                  Customization
                </CardTitle>
                <CardDescription>Personalize your character</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="clothing" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 bg-[hsl(var(--bc-bg-light))]">
                    <TabsTrigger value="clothing" className="text-xs">
                      <Shirt className="w-4 h-4 mr-1" />
                      Clothing
                    </TabsTrigger>
                    <TabsTrigger value="colors" className="text-xs">
                      <Palette className="w-4 h-4 mr-1" />
                      Colors
                    </TabsTrigger>
                    <TabsTrigger value="accessories" className="text-xs">
                      <Sparkles className="w-4 h-4 mr-1" />
                      Extras
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="clothing" className="mt-4 space-y-3">
                    <div className="text-center py-8 text-[hsl(var(--bc-text-muted))]">
                      <Shirt className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">Clothing options coming soon!</p>
                      <Badge variant="secondary" className="mt-2">Beta</Badge>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="colors" className="mt-4 space-y-3">
                    <div className="text-center py-8 text-[hsl(var(--bc-text-muted))]">
                      <Palette className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">Color customization coming soon!</p>
                      <Badge variant="secondary" className="mt-2">Beta</Badge>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="accessories" className="mt-4 space-y-3">
                    <div className="text-center py-8 text-[hsl(var(--bc-text-muted))]">
                      <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">Accessories coming soon!</p>
                      <Badge variant="secondary" className="mt-2">Beta</Badge>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card className="bg-[hsl(var(--bc-bg-card))] border-[hsl(var(--bc-border))]">
              <CardHeader>
                <CardTitle className="text-[hsl(var(--bc-text))] text-sm">Avatar Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between text-[hsl(var(--bc-text-muted))]">
                  <span>Items Owned</span>
                  <span className="text-[hsl(var(--bc-text))]">0</span>
                </div>
                <div className="flex justify-between text-[hsl(var(--bc-text-muted))]">
                  <span>Outfits Saved</span>
                  <span className="text-[hsl(var(--bc-text))]">0</span>
                </div>
                <div className="flex justify-between text-[hsl(var(--bc-text-muted))]">
                  <span>Rarity Score</span>
                  <span className="text-[hsl(var(--bc-accent))]">—</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
