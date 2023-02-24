import { BarElement, CategoryScale, Chart as ChartJS, LinearScale, Title, Tooltip } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { clsx } from 'clsx';
import { differenceInMilliseconds, format } from 'date-fns';
import Head from 'next/head';
import React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, ChartDataLabels);

const fetchWithTimeout = async (resource: RequestInfo | URL, options: RequestInit & { timeout: number }) => {
  const { timeout = 8000 } = options;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const response = await fetch(resource, {
    ...options,
    signal: controller.signal,
  });
  clearTimeout(id);
  return response;
};

const fetchPing = async () => {
  const startDate = new Date();

  await fetchWithTimeout('/ping.txt', {
    method: 'GET',
    timeout: 999,
  });

  const endDate = new Date();

  return differenceInMilliseconds(endDate, startDate);
};

export default function Home() {
  const [timeout, setTimeOut] = useState<NodeJS.Timeout | undefined>();
  const [isStarted, setIsStarted] = useState<boolean>(false);

  const [values, setValues] = useState<[string, number][]>([]);
  const [sended, setSended] = useState(0);
  const [failed, setFailed] = useState(0);
  const [min, setMin] = useState(0);
  const [max, setMax] = useState(0);
  const [avg, setAvg] = useState(0);

  const scan = useCallback(async () => {
    if (isStarted) {
      try {
        const res = Math.round(await fetchPing());

        setValues((v) => [...v, [format(new Date(), 'HH:mm:ss'), res]]);
        setSended((v) => v + 1);
        setTimeOut(
          setTimeout(() => {
            scan();
          }, 1000),
        );
      } catch (error) {
        setFailed((v) => v + 1);
        setValues((v) => [...v, [format(new Date(), 'HH:mm:ss'), 999]]);
        setTimeOut(
          setTimeout(() => {
            scan();
          }, 1000),
        );
      }
    }
  }, [isStarted]);

  useEffect(() => {
    if (isStarted) {
      setValues([]);
      setSended(0);
      setFailed(0);
      scan();
    } else {
      if (timeout) {
        clearTimeout(timeout);
        setTimeOut(undefined);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStarted]);

  useEffect(() => {
    if (values) {
      setMin(values?.length > 0 ? Math.min(...values.map((v) => v[1])) : 0);
      setMax(values?.length > 0 ? Math.max(...values.map((v) => v[1])) : 0);
      setAvg(values.reduce((a, b) => a + b[1], 0) / values?.length || 0);
    }
  }, [values]);

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
            <button
              className={clsx(
                'py-2 px-3 font-bold uppercase text-white',
                !isStarted ? 'bg-green-500' : 'bg-red-500',
                'rounded-md hover:opacity-60',
              )}
              onClick={() => setIsStarted((v) => !v)}
            >
              {isStarted ? 'stop' : 'start'}
            </button>
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
                        ?.slice(-10)
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
