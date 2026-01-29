"use client";

/**
 * Accounts Page
 *
 * Manage simulated and real trading accounts.
 */

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectOption } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useAccounts,
  useCreateSimulatedAccount,
  useCreateRealAccount,
  useActivateAccount,
} from "@/lib/api/hooks/use-accounts";
import { cn } from "@/lib/utils";
import { AlertTriangle, FlaskConical, ShieldCheck, Wallet } from "lucide-react";

const PROVIDERS = [
  { value: "binance", label: "Binance" },
  { value: "okx", label: "OKX" },
  { value: "bybit", label: "Bybit" },
];

export default function AccountsPage() {
  const t = useTranslations("accountsPage");
  const { data, isLoading, isError, refetch } = useAccounts();
  const createSimulated = useCreateSimulatedAccount();
  const createReal = useCreateRealAccount();
  const activateAccount = useActivateAccount();

  const [simName, setSimName] = useState("");
  const [simCapital, setSimCapital] = useState("100000");
  const [simSetActive, setSimSetActive] = useState(true);

  const [realName, setRealName] = useState("");
  const [realProvider, setRealProvider] = useState("binance");
  const [realApiKey, setRealApiKey] = useState("");
  const [realApiSecret, setRealApiSecret] = useState("");
  const [realPassphrase, setRealPassphrase] = useState("");
  const [realPermissions, setRealPermissions] = useState("read,trade");
  const [realSetActive, setRealSetActive] = useState(false);

  const accounts = data?.accounts ?? [];
  const activeAccountId = data?.activeAccountId ?? null;

  const { simulatedAccounts, realAccounts, activeAccount } = useMemo(() => {
    const simulated = accounts.filter((account) => account.mode === "simulated");
    const real = accounts.filter((account) => account.mode === "real");
    const active = accounts.find((account) => account.id === activeAccountId);
    return {
      simulatedAccounts: simulated,
      realAccounts: real,
      activeAccount: active,
    };
  }, [accounts, activeAccountId]);

  const handleCreateSimulated = async () => {
    if (!simName.trim()) return;

    const initialCapital = Number(simCapital);
    try {
      await createSimulated.mutateAsync({
        name: simName.trim(),
        initialCapital: Number.isFinite(initialCapital) ? initialCapital : undefined,
        setActive: simSetActive,
      });
      setSimName("");
      setSimCapital("100000");
    } catch {
      // error handled by mutation state
    }
  };

  const handleCreateReal = async () => {
    if (!realName.trim() || !realApiKey.trim() || !realApiSecret.trim()) return;

    const permissions = realPermissions
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    try {
      await createReal.mutateAsync({
        name: realName.trim(),
        provider: realProvider as "binance" | "okx" | "bybit",
        credentials: {
          apiKey: realApiKey.trim(),
          apiSecret: realApiSecret.trim(),
          passphrase: realPassphrase.trim() || undefined,
        },
        permissions,
        setActive: realSetActive,
      });
      setRealName("");
      setRealApiKey("");
      setRealApiSecret("");
      setRealPassphrase("");
    } catch {
      // error handled by mutation state
    }
  };

  const renderStatusBadge = (status: string) => (
    <Badge
      variant={status === "error" ? "destructive" : "outline"}
      className={cn(
        status === "active" && "border-emerald-500/40 text-emerald-600",
        status === "pending" && "border-amber-500/40 text-amber-600",
        status === "inactive" && "text-muted-foreground"
      )}
    >
      {status === "active"
        ? t("active")
        : status === "pending"
          ? t("pending")
          : status === "error"
            ? t("error")
            : t("inactive")}
    </Badge>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        icon={Wallet}
      >
        <Button variant="outline" onClick={() => refetch()}>
          {t("refresh")}
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            {t("activeAccount")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <p className="text-sm text-muted-foreground">{t("loading")}</p>}
          {isError && (
            <p className="flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" />
              {t("loadError")}
            </p>
          )}
          {!isLoading && !activeAccount && !isError && (
            <EmptyState
              title={t("noActiveAccount")}
              description={t("noActiveAccountHint")}
              size="sm"
            />
          )}
          {activeAccount && (
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">{activeAccount.name}</h3>
                  {renderStatusBadge(activeAccount.status)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {activeAccount.mode === "simulated" ? t("simulated") : t("real")}
                  {activeAccount.provider
                    ? ` · ${activeAccount.provider.toUpperCase()}`
                    : ""}
                </p>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <div>{t("updatedAt")}</div>
                <div>{new Date(activeAccount.updatedAt).toLocaleString()}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-primary" />
              {t("simulatedAccounts")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {simulatedAccounts.length === 0 ? (
              <EmptyState
                title={t("noSimAccounts")}
                description={t("noSimAccountsHint")}
                size="sm"
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("name")}</TableHead>
                    <TableHead>{t("status")}</TableHead>
                    <TableHead>{t("capital")}</TableHead>
                    <TableHead>{t("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {simulatedAccounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">{account.name}</TableCell>
                      <TableCell>{renderStatusBadge(account.status)}</TableCell>
                      <TableCell>
                        {Number.isFinite(Number(account.metadata?.initialCapital))
                          ? `$${Number(account.metadata?.initialCapital).toLocaleString()}`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => activateAccount.mutate(account.id)}
                          disabled={
                            activateAccount.isPending ||
                            account.id === activeAccountId ||
                            account.status === "error"
                          }
                        >
                          {account.id === activeAccountId
                            ? t("active")
                            : t("activate")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              {t("realAccounts")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {realAccounts.length === 0 ? (
              <EmptyState
                title={t("noRealAccounts")}
                description={t("noRealAccountsHint")}
                size="sm"
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("name")}</TableHead>
                    <TableHead>{t("provider")}</TableHead>
                    <TableHead>{t("status")}</TableHead>
                    <TableHead>{t("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {realAccounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">{account.name}</TableCell>
                      <TableCell>{account.provider?.toUpperCase() || "-"}</TableCell>
                      <TableCell>{renderStatusBadge(account.status)}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => activateAccount.mutate(account.id)}
                          disabled={
                            activateAccount.isPending ||
                            account.id === activeAccountId ||
                            account.status === "error"
                          }
                        >
                          {account.id === activeAccountId
                            ? t("active")
                            : t("activate")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("createSimulated")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sim-name">{t("name")}</Label>
              <Input
                id="sim-name"
                placeholder={t("simNamePlaceholder")}
                value={simName}
                onChange={(event) => setSimName(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sim-capital">{t("initialCapital")}</Label>
              <Input
                id="sim-capital"
                type="number"
                min="0"
                value={simCapital}
                onChange={(event) => setSimCapital(event.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={simSetActive}
                onChange={(event) => setSimSetActive(event.target.checked)}
              />
              {t("setActive")}
            </label>
            {createSimulated.error && (
              <p className="text-sm text-destructive">
                {t("createFailed")}
              </p>
            )}
            <Button
              onClick={handleCreateSimulated}
              disabled={createSimulated.isPending || !simName.trim()}
              className="w-full"
            >
              {createSimulated.isPending ? t("creating") : t("createSimulated")}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("linkReal")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="real-name">{t("name")}</Label>
              <Input
                id="real-name"
                placeholder={t("realNamePlaceholder")}
                value={realName}
                onChange={(event) => setRealName(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="real-provider">{t("provider")}</Label>
              <Select
                id="real-provider"
                value={realProvider}
                onChange={(event) => setRealProvider(event.target.value)}
              >
                {PROVIDERS.map((provider) => (
                  <SelectOption key={provider.value} value={provider.value}>
                    {provider.label}
                  </SelectOption>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="real-api-key">{t("apiKey")}</Label>
              <Input
                id="real-api-key"
                value={realApiKey}
                onChange={(event) => setRealApiKey(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="real-api-secret">{t("apiSecret")}</Label>
              <Input
                id="real-api-secret"
                type="password"
                value={realApiSecret}
                onChange={(event) => setRealApiSecret(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="real-passphrase">{t("passphrase")}</Label>
              <Input
                id="real-passphrase"
                value={realPassphrase}
                onChange={(event) => setRealPassphrase(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="real-permissions">{t("permissions")}</Label>
              <Input
                id="real-permissions"
                placeholder="read,trade"
                value={realPermissions}
                onChange={(event) => setRealPermissions(event.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={realSetActive}
                onChange={(event) => setRealSetActive(event.target.checked)}
              />
              {t("setActive")}
            </label>
            {createReal.error && (
              <p className="text-sm text-destructive">
                {t("createFailed")}
              </p>
            )}
            <Button
              variant="outline"
              onClick={handleCreateReal}
              disabled={
                createReal.isPending ||
                !realName.trim() ||
                !realApiKey.trim() ||
                !realApiSecret.trim()
              }
              className="w-full"
            >
              {createReal.isPending ? t("linking") : t("linkReal")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
