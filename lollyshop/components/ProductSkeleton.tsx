'use client'

import React from 'react';

export default function ProductSkeleton() {
    return (
        <div className="bg-white rounded-lg overflow-hidden border border-gray-100 animate-pulse">
            <div className="aspect-square bg-gray-100" />
            <div className="p-4 space-y-3">
                <div className="h-2 w-1/3 bg-gray-100 rounded" />
                <div className="h-4 w-full bg-gray-100 rounded" />
                <div className="h-6 w-1/2 bg-gray-100 rounded" />
                <div className="h-10 w-full bg-gray-100 rounded-md mt-4" />
            </div>
        </div>
    );
}
