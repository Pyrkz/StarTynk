import { Metadata } from "next";
import { EmployeesPage } from "@/features/employees/components/EmployeesPage";

export const metadata: Metadata = {
  title: "Pracownicy | Startynk",
  description: "Zarządzanie pracownikami i płatnościami",
};

export default function PracownicyPage() {
  return <EmployeesPage />;
}