"use client";

/**
 * Account Switcher
 *
 * Dropdown for selecting active simulated or real accounts.
 */

import { useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  useAccounts,
  useActivateAccount,
} from "@/lib/api/hooks/use-accounts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, RefreshCw, Wallet, AlertTriangle } from "lucide-react";

export function AccountSwitcher() {
  const t = useTranslations("accountsSwitcher");
  const tAccounts = useTranslations("accountsPage");
  const { data, isLoading, isError, refetch } = useAccounts();
  const activateAccount = useActivateAccount();

  const activeAccount = useMemo(() => {
    if (!data) return undefined;
    return data.accounts.find((account) => account.id === data.activeAccountId);
  }, [data]);

  const hasAccounts = (data?.accounts?.length || 0) > 0;
  const buttonLabel = activeAccount?.name || t("selectAccount");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 min-w-[140px] justify-between"
          aria-label={t("label")}
        >
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span className="truncate max-w-[120px]">
              {isLoading ? t("loading") : buttonLabel}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {activeAccount && (
              <Badge variant="secondary" className="text-xs">
                {activeAccount.mode === "simulated"
                  ? tAccounts("simulated")
                  : tAccounts("real")}
              </Badge>
            )}
            <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[260px]">
        <DropdownMenuLabel>{t("title")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isError && (
          <DropdownMenuItem className="text-destructive">
            <AlertTriangle className="h-4 w-4" />
            {t("loadError")}
          </DropdownMenuItem>
        )}
        {!isLoading && !hasAccounts && !isError && (
          <DropdownMenuItem>{t("noAccounts")}</DropdownMenuItem>
        )}
        {data?.accounts.map((account) => {
          const isActive = account.id === data.activeAccountId;
          const statusLabel =
            account.status === "active"
              ? tAccounts("active")
              : account.status === "pending"
                ? tAccounts("pending")
                : account.status === "error"
                  ? tAccounts("error")
                  : tAccounts("inactive");
          return (
            <DropdownMenuItem
              key={account.id}
              onSelect={() => {
                if (!isActive) {
                  activateAccount.mutate(account.id);
                }
              }}
              disabled={activateAccount.isPending || isActive || account.status === "error"}
              className={cn("cursor-pointer", isActive && "bg-accent")}
            >
              <div className="flex w-full items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-medium">{account.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {account.mode === "simulated"
                      ? tAccounts("simulated")
                      : tAccounts("real")}
                    {account.provider ? ` · ${account.provider.toUpperCase()}` : ""}
                  </div>
                </div>
                <Badge
                  variant={account.status === "error" ? "destructive" : "outline"}
                  className={cn(
                    account.status === "active" && "border-emerald-500/40 text-emerald-600",
                    account.status === "pending" && "border-amber-500/40 text-amber-600",
                    account.status === "inactive" && "text-muted-foreground"
                  )}
                >
                  {statusLabel}
                </Badge>
              </div>
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => refetch()}
          className="cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
          {t("refresh")}
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href="/accounts">{t("manageAccounts")}</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
