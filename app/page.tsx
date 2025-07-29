'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useTable } from 'react-table'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import classNames from 'classnames'

type Stock = {
  symbol: string
  name: string
  cmp: number
  exchange: string
  peRatio: number
  earnings: number
  purchasePrice: number
  quantity: number
  sector: string
}

const COLORS = ['#3b82f6', '#10b981', '#facc15', '#ef4444', '#6366f1', '#f97316']
const symbols = [
  'RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 'ICICIBANK.NS',
  'KOTAKBANK.NS', 'SBIN.NS', 'BAJFINANCE.NS', 'AXISBANK.NS', 'ITC.NS',
  'LT.NS', 'ULTRACEMCO.NS', 'MARUTI.NS', 'ASIANPAINT.NS', 'TECHM.NS',
  'HCLTECH.NS', 'WIPRO.NS', 'COALINDIA.NS', 'BHARTIARTL.NS'
]

export default function PortfolioPage() {
  const [stocks, setStocks] = useState<Stock[]>([])
  const [selectedSector, setSelectedSector] = useState<string>('All')
  const [loading, setLoading] = useState(true)

  const fetchStockData = async () => {
    try {
      const joined = symbols.join(',')
      const res = await fetch(`https://stock-portfolio-backend-flax.vercel.app/api/portfolio/quotes?symbols=${joined}`)
      const json = await res.json()
      const enriched = json.data.map((s: Stock) => ({
        ...s,
        purchasePrice: s.cmp * 0.9,
        quantity: 10,
        sector: s.symbol.includes('BANK') ? 'Financials' :
                s.symbol.includes('TECH') || s.symbol.includes('INFY') || s.symbol.includes('WIPRO') ? 'Technology' :
                s.symbol.includes('RELIANCE') || s.symbol.includes('COAL') ? 'Energy' :
                'Others'
      }))
      setStocks(enriched)
    } catch (error) {
      console.error('Error fetching stock data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStockData()
    const interval = setInterval(fetchStockData, 15000)
    return () => clearInterval(interval)
  }, [])

  const uniqueSectors = useMemo(() => ['All', ...new Set(stocks.map(s => s.sector))], [stocks])
  const filteredStocks = useMemo(() => selectedSector === 'All' ? stocks : stocks.filter(s => s.sector === selectedSector), [stocks, selectedSector])
  const totalInvestment = useMemo(() => filteredStocks.reduce((sum, s) => sum + s.purchasePrice * s.quantity, 0), [filteredStocks])
  const totalValue = useMemo(() => filteredStocks.reduce((sum, s) => sum + s.cmp * s.quantity, 0), [filteredStocks])
  const totalGain = useMemo(() => totalValue - totalInvestment, [totalValue, totalInvestment])

  const columns: any = useMemo(() => [
    { Header: 'Stock', accessor: 'name' },
    { Header: 'Purchase Price', accessor: 'purchasePrice', Cell: ({ value }: any) => `₹${value.toFixed(2)}` },
    { Header: 'Quantity', accessor: 'quantity' },
    { Header: 'Investment', accessor: (row: Stock) => row.purchasePrice * row.quantity, id: 'investment', Cell: ({ value }: any) => `₹${value.toFixed(2)}` },
    { Header: 'Portfolio %', accessor: (row: Stock) => ((row.purchasePrice * row.quantity) / totalInvestment) * 100, id: 'portfolioPercentage', Cell: ({ value }: any) => `${value.toFixed(1)}%` },
    { Header: 'Exchange', accessor: 'exchange' },
    { Header: 'CMP', accessor: 'cmp', Cell: ({ value }: any) => `₹${value.toFixed(2)}` },
    { Header: 'Present Value', accessor: (row: Stock) => row.cmp * row.quantity, id: 'presentValue', Cell: ({ value }: any) => `₹${value.toFixed(2)}` },
    { Header: 'Gain/Loss', accessor: (row: Stock) => row.cmp * row.quantity - row.purchasePrice * row.quantity, id: 'gainLoss', Cell: ({ value }: any) => (<span className={classNames('font-semibold', { 'text-success': value >= 0, 'text-error': value < 0 })}>{value >= 0 ? '+' : '-'}₹{Math.abs(value).toFixed(2)}</span>) },
    { Header: 'P/E Ratio', accessor: 'peRatio' },
    { Header: 'Earnings', accessor: 'earnings', Cell: ({ value }: any) => `₹${value.toFixed(2)}` }
  ], [totalInvestment])

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable({ columns, data: filteredStocks })
  const chartData = useMemo(() => filteredStocks.map((s) => ({ name: s.symbol, value: Number((s.purchasePrice * s.quantity).toFixed(2)) })), [filteredStocks])

  return (
    <main className="p-4">
      <h1 className="text-3xl font-bold mb-6 text-neutral">Stock Portfolio Dashboard</h1>

      <div className="mb-6">
        <label className="label mr-3">
          <span className="label-text font-semibold">Filter by Sector</span>
        </label>
        <select
          className="select select-bordered w-full max-w-xs"
          value={selectedSector}
          onChange={(e) => setSelectedSector(e.target.value)}
        >
          {uniqueSectors.map((sector) => (
            <option key={sector} value={sector}>{sector}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="skeleton h-24 w-full rounded-xl" />
          <div className="skeleton h-24 w-full rounded-xl" />
          <div className="skeleton h-24 w-full rounded-xl" />
          <div className="skeleton h-[350px] w-full rounded-xl" />
          <div className="skeleton h-[300px] w-full rounded-xl" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="card bg-base-100 shadow-md">
              <div className="card-body">
                <h2 className="card-title">Total Investment</h2>
                <p className="text-lg font-bold text-neutral">₹{totalInvestment.toFixed(2)}</p>
              </div>
            </div>
            <div className="card bg-base-100 shadow-md">
              <div className="card-body">
                <h2 className="card-title">Present Value</h2>
                <p className="text-lg font-bold text-neutral">₹{totalValue.toFixed(2)}</p>
              </div>
            </div>
            <div className="card bg-base-100 shadow-md">
              <div className="card-body">
                <h2 className="card-title">Total Gain/Loss</h2>
                <p className={`text-lg font-bold ${totalGain >= 0 ? 'text-success' : 'text-error'}`}>{totalGain >= 0 ? '+' : '-'}₹{Math.abs(totalGain).toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto bg-base-100 rounded-xl shadow-md">
            <table {...getTableProps()} className="table table-zebra w-full text-sm">
              <thead className="bg-base-200 text-base-content">
                {headerGroups.map((headerGroup: any) => (
                  <tr {...headerGroup.getHeaderGroupProps()}>
                    {headerGroup.headers.map((column: any) => (
                      <th {...column.getHeaderProps()} className="px-4 py-3 font-semibold">
                        {column.render('Header')}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody {...getTableBodyProps()}>
                {rows.map((row: any, rowIndex: number) => {
                  prepareRow(row)
                  const rowProps = row.getRowProps()
                  return (
                    <tr key={rowProps.key || rowIndex} {...rowProps} className="hover">
                      {row.cells.map((cell: any, cellIndex: number) => {
                        const cellProps = cell.getCellProps()
                        const cellKey = cellProps.key
                        delete cellProps.key
                        return (
                          <td key={cellKey || cellIndex} {...cellProps} className="px-4 py-3">
                            {cell.render('Cell')}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="bg-base-100 rounded-lg shadow-md mt-6 p-4 w-full">
            <h2 className="text-lg font-semibold mb-4">Investment Distribution</h2>
            <div className="w-full h-[450px] lg:h-[450px] md:h-[400px] sm:h-[550px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>  
                  <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    {chartData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </main>
  )
}
