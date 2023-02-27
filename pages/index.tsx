import { BarElement, CategoryScale, Chart as ChartJS, LinearScale, Title, Tooltip } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import Head from 'next/head';
import React, { useRef } from 'react';
import { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, ChartDataLabels);

export default function Home() {
  const [values, setValues] = useState<[string, number][]>([]);
  const [sended, setSended] = useState(0);
  const [failed, setFailed] = useState(0);
  const [min, setMin] = useState(0);
  const [max, setMax] = useState(0);
  const [avg, setAvg] = useState(0);
  const [avgLast, setAvgLast] = useState(0);

  useEffect(() => {
    if (values) {
      setMin(values?.length > 0 ? Math.min(...values.map((v) => v[1])) : 0);
      setMax(values?.length > 0 ? Math.max(...values.map((v) => v[1])) : 0);
      setAvg(values.reduce((a, b) => a + b[1], 0) / values?.length || 0);
      setAvgLast(values.slice(-20).reduce((a, b) => a + b[1], 0) / values.slice(-20)?.length || 0);
    }
  }, [values]);

  const workerRef = useRef<Worker>();

  useEffect(() => {
    workerRef.current = new Worker(new URL('../public/worker.js', import.meta.url));
    workerRef.current.onmessage = (event: MessageEvent<[number, number][]>) => {
      //@ts-ignore
      setValues((v) => [...v, [format(new Date(event.data[0]), 'HH:mm:ss'), event.data[1]]]);

      //@ts-ignore
      if (event.data[1] === 999) {
        setFailed((v) => v + 1);
      } else {
        setSended((v) => v + 1);
      }
    };
    return () => {
      workerRef.current!.terminate();
    };
  }, []);

  return (
    <>
      <Head>
        <title>Stability Test</title>
        <meta name="description" content="Check Internet Stability" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main className="flex h-screen w-screen items-center justify-center">
        <div className="space-y-5">
          <div>
            <h1 className="text-xl font-bold">Stability test</h1>
            <h2>A simple tool to check your internet connection and stability</h2>
          </div>

          <div className="mx-auto text-center">
            <p>
              Hosted server based to <b>Paris, France</b>
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex w-full flex-wrap items-center justify-center gap-3">
              <div>
                <p>
                  Sended : <b>{sended}</b>
                </p>
              </div>

              <div>
                <p className={clsx(failed > 0 && 'text-red-500')}>
                  Failed : <b>{failed}</b>
                </p>
              </div>
            </div>

            <div className="flex w-full flex-wrap items-center justify-center gap-3">
              <div>
                <p
                  className={clsx(
                    min > 0 && min < 50 && 'text-green-500',
                    min >= 50 && min < 100 && 'text-yellow-500',
                    min >= 100 && min < 200 && 'text-orange-500',
                    min >= 200 && 'text-red-500',
                  )}
                >
                  Min : <b>{Math.round(min)}</b> ms
                </p>
              </div>

              <div>
                <p
                  className={clsx(
                    max > 0 && max < 50 && 'text-green-500',
                    max >= 50 && max < 100 && 'text-yellow-500',
                    max >= 100 && max < 200 && 'text-orange-500',
                    max >= 200 && 'text-red-500',
                  )}
                >
                  Max : <b>{Math.round(max)}</b> ms
                </p>
              </div>

              <div>
                <p
                  className={clsx(
                    avg > 0 && avg < 50 && 'text-green-500',
                    avg >= 50 && avg < 100 && 'text-yellow-500',
                    avg >= 100 && avg < 200 && 'text-orange-500',
                    avg >= 200 && 'text-red-500',
                  )}
                >
                  Avg : <b>{Math.round(avg)}</b> ms
                </p>
              </div>

              <div>
                <p
                  className={clsx(
                    avgLast > 0 && avgLast < 50 && 'text-green-500',
                    avgLast >= 50 && avgLast < 100 && 'text-yellow-500',
                    avgLast >= 100 && avgLast < 200 && 'text-orange-500',
                    avgLast >= 200 && 'text-red-500',
                  )}
                >
                  Avg (Last 20) : <b>{Math.round(avgLast)}</b> ms
                </p>
              </div>
            </div>
          </div>

          {values?.length > 0 && (
            <div className="w-full">
              <Bar
                options={{
                  responsive: true,
                  plugins: {
                    title: {
                      display: true,
                      text: 'Latency (ms)',
                    },
                    datalabels: {
                      font: {
                        weight: 'bolder',
                      },
                      color: 'white',
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                  animation: {
                    duration: 0,
                  },
                }}
                data={{
                  labels: values.slice(-20).map((v) => v[0]),
                  datasets: [
                    {
                      label: 'latency',
                      data: values.slice(-20).map((v) => v[1]),
                      backgroundColor: values
                        ?.slice(-20)
                        .map((v) => v[1])
                        .map((v) => {
                          if (v < 50) {
                            return '#22C55E';
                          }

                          if (v < 100) {
                            return '#EAB308';
                          }

                          if (v < 200) {
                            return '#f97316';
                          }

                          if (v === 999) {
                            return '#18181b';
                          }

                          return '#ef4444';
                        }),
                    },
                  ],
                }}
              />
            </div>
          )}
          <div className="text-center">
            <a
              className="font-bold text-blue-500 underline hover:opacity-60"
              href="https://qlaffont.com"
              target="_blank"
              rel="noreferrer"
            >
              Developped by Quentin Laffont
            </a>
          </div>
        </div>
      </main>
    </>
  );
}
