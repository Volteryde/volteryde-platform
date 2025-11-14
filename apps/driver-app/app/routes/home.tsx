import { DriverMap } from '../components/Map';

export function meta() {
  return [
    { title: 'Volteryde Driver App - Map' },
    { name: 'description', content: 'Real-time driver map with routing' },
  ];
}

export default function Home() {
  return (
    <main>
      <DriverMap />
    </main>
  );
}
