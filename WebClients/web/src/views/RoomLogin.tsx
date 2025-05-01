import type { Component } from 'solid-js';
import RoomForm from '../components/RoomForm';

const RoomLogin: Component = () => {
    return (
        <div class="h-[100svh] flex justify-center items-center bg-factOrFable-primary">
            <RoomForm />
        </div>
    );
};

export default RoomLogin;
