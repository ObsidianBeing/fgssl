"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { columns } from "@/components/dashboard/appointments/columns"
import { DataTable } from "@/components/dashboard/appointments/data-table"
import { Appointment } from "@/types/appointments"
import { FilterControls } from "@/components/dashboard/appointments/filter-controls"
import { ExportButtons } from "@/components/ui/export-buttons"
import { ErrorComponent } from "@/components/ui/error-component"
import { Button } from "@/components/ui/button"
import { SendRemindersButton } from "@/components/dashboard/appointments/send-reminder-button"
import { Calendar, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { subDays } from 'date-fns'

export default function AppointmentsPage() {
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { toast } = useToast()
    const abortControllerRef = useRef<AbortController | null>(null)

    // Filter states
    const [status, setStatus] = useState<string | null>(null)
    const [medium, setMedium] = useState<string | null>(null)
    const [createdDateRange, setCreatedDateRange] = useState<[Date, Date] | null>(() => [
        subDays(new Date(), 30),
        new Date()
    ])
    const [preferredDateRange, setPreferredDateRange] = useState<[Date, Date] | null>(null)

    const fetchAppointments = useCallback(async () => {
        // Cancel previous request if it exists
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }

        const controller = new AbortController()
        abortControllerRef.current = controller

        setIsLoading(true)
        setError(null)

        try {
            const params = new URLSearchParams()

            // Add filters if they exist
            if (status) params.append('status', status)
            if (medium) params.append('medium', medium)
            if (createdDateRange) {
                params.append('createdFrom', createdDateRange[0].toISOString())
                params.append('createdTo', createdDateRange[1].toISOString())
            }
            if (preferredDateRange) {
                params.append('preferredFrom', preferredDateRange[0].toISOString())
                params.append('preferredTo', preferredDateRange[1].toISOString())
            }

            // Add pagination parameters (you might want to make these stateful later)
            params.append('page', '1')
            params.append('pageSize', '100') // Set a high pageSize to get all data initially

            const response = await fetch(`/api/appointments?${params.toString()}`, {
                signal: controller.signal
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to fetch appointments')
            }

            const data = await response.json()
            setAppointments(data.items)
        } catch (err: unknown) {
            if (err instanceof Error && err.name !== 'AbortError') {
                console.error('Failed to fetch appointments:', err)
                setError(err instanceof Error ? err.message : 'An unknown error occurred')
                toast({
                    title: "Error",
                    description: "Failed to load appointments",
                    variant: "destructive"
                })
            }
        } finally {
            if (!controller.signal.aborted) {
                setIsLoading(false)
            }
            abortControllerRef.current = null
        }
    }, [status, medium, createdDateRange, preferredDateRange, toast])

    // Fetch data when filters change with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchAppointments()
        }, 300) // 300ms debounce

        return () => {
            clearTimeout(timer)
            if (abortControllerRef.current) {
                abortControllerRef.current.abort()
            }
        }
    }, [fetchAppointments])

    const refreshData = () => {
        fetchAppointments()
    }

    const clearAllFilters = () => {
        setStatus(null)
        setMedium(null)
        setCreatedDateRange([subDays(new Date(), 30), new Date()])
        setPreferredDateRange(null)
    }

    if (error) {
        return (
            <ErrorComponent
                title="Appointments Error"
                message={error}
                retryLink="/dashboard/appointments"
            />
        )
    }

    return (
        <div className="container-custom py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-2xl font-bold">Appointments</h2>
                    <p className="text-muted-foreground">
                        {isLoading ? "Loading appointments..." : `Showing ${appointments.length} appointments`}
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <ExportButtons
                        data={appointments}
                        filename="appointments_export"
                        disabled={isLoading || appointments.length === 0}
                    />
                    <Button
                        variant="outline"
                        disabled={isLoading}
                        onClick={() => toast({
                            title: "Coming Soon",
                            description: "Calendar view will be available in the next update",
                        })}
                    >
                        {isLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Calendar className="mr-2 h-4 w-4" />
                        )}
                        Calendar View
                    </Button>
                    <SendRemindersButton
                        disabled={isLoading || appointments.length === 0}
                        onSuccess={refreshData}
                    />
                </div>
            </div>

            <FilterControls
                status={status}
                onStatusChange={setStatus}
                medium={medium}
                onMediumChange={setMedium}
                createdRange={createdDateRange}
                onCreatedRangeChange={setCreatedDateRange}
                preferredRange={preferredDateRange}
                onPreferredRangeChange={setPreferredDateRange}
                disabled={isLoading}
                onClearAll={clearAllFilters}
                isLoading={isLoading}
            />

            <div className="bg-white rounded-lg border shadow-sm mt-4">
                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : appointments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                        <p>No appointments found</p>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2"
                            onClick={refreshData}
                        >
                            Refresh
                        </Button>
                    </div>
                ) : (
                    <DataTable
                        columns={columns}
                        data={appointments}
                    />
                )}
            </div>
        </div>
    )
}