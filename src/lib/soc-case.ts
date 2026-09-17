export type SeverityTag = "Low" | "Medium" | "High" | "Critical";

export type AttackVector =
  | "SSH Brute Force"
  | "SQL Injection"
  | "Exfiltração de Dados"
  | "Malware C2"
  | "Credential Stuffing";

export type Mitigation =
  | "Bloquear IP na Firewall"
  | "Isolar Host"
  | "Reset de Credenciais"
  | "Aplicar WAF / Patch da Aplicação"
  | "Revogar Sessões e Tokens";

export type LogKind = "syslog" | "json" | "apache";
export type LogLevel = "info" | "warn" | "crit";

export type LogLine = {
  raw: string;
  kind: LogKind;
  level: LogLevel;
};

export type CaseAnswer = {
  attackerIp: string;
  vector: AttackVector;
  port: number;
  severity: SeverityTag;
  mitigation: Mitigation;
};

export type CaseHints = Record<keyof CaseAnswer, string>;

export type SocCase = {
  id: string;
  title: string;
  summary: string;
  host: string;
  telemetry: string;
  answer: CaseAnswer;
  hints: CaseHints;
  logs: LogLine[];
};

export const attackVectors: readonly AttackVector[] = [
  "SSH Brute Force",
  "SQL Injection",
  "Exfiltração de Dados",
  "Malware C2",
  "Credential Stuffing",
];

export const mitigations: readonly Mitigation[] = [
  "Bloquear IP na Firewall",
  "Isolar Host",
  "Reset de Credenciais",
  "Aplicar WAF / Patch da Aplicação",
  "Revogar Sessões e Tokens",
];

export const severityTags: readonly SeverityTag[] = ["Low", "Medium", "High", "Critical"];

export const severityStyles: Record<SeverityTag, string> = {
  Low: "border-info/50 bg-info/10 text-info",
  Medium: "border-alert/50 bg-alert/10 text-alert",
  High: "border-critical/40 bg-critical/10 text-critical",
  Critical: "border-critical bg-critical/20 text-critical",
};

export const socCases: readonly SocCase[] = [
  {
    id: "104",
    title: "Múltiplas falhas de autenticação SSH em banco de produção",
    summary:
      "O sensor de IDS acusou centenas de tentativas de login SSH em menos de dois minutos contra o host db-prod-02, seguidas de um acesso aceito.",
    host: "db-prod-02",
    telemetry: "IDS · Syslog · EDR",
    answer: {
      attackerIp: "185.203.116.42",
      vector: "SSH Brute Force",
      port: 22,
      severity: "High",
      mitigation: "Bloquear IP na Firewall",
    },
    hints: {
      attackerIp: "Um único endereço externo repete as falhas de autenticação.",
      vector:
        "Centenas de tentativas em 90 segundos caracterizam um padrão de adivinhação de senha.",
      port: "Confira o campo dst_port do evento do sensor.",
      severity: "Houve acesso aceito, mas ainda sem dado sensível confirmado saindo.",
      mitigation: "A prioridade é cortar a origem externa no perímetro.",
    },
    logs: [
      {
        kind: "syslog",
        level: "warn",
        raw: "Sep 10 02:11:04 db-prod-02 sshd[20114]: Failed password for invalid user root from 185.203.116.42 port 51422 ssh2",
      },
      {
        kind: "syslog",
        level: "warn",
        raw: "Sep 10 02:11:07 db-prod-02 sshd[20117]: Failed password for invalid user admin from 185.203.116.42 port 51438 ssh2",
      },
      {
        kind: "syslog",
        level: "warn",
        raw: "Sep 10 02:11:12 db-prod-02 sshd[20121]: Failed password for invalid user postgres from 185.203.116.42 port 51455 ssh2",
      },
      {
        kind: "json",
        level: "warn",
        raw: '{"ts":"2026-09-10T02:11:19Z","source":"ids-sensor-04","event":"ssh_bruteforce_threshold","attempts":274,"window_sec":90,"src_ip":"185.203.116.42","dst_port":22,"dst_host":"db-prod-02"}',
      },
      {
        kind: "syslog",
        level: "crit",
        raw: "Sep 10 02:12:41 db-prod-02 sshd[20233]: Accepted password for svc_backup from 185.203.116.42 port 51702 ssh2",
      },
      {
        kind: "json",
        level: "info",
        raw: '{"ts":"2026-09-10T02:13:10Z","source":"edr-agent","event":"session_open","host":"db-prod-02","user":"svc_backup","shell":"/bin/bash"}',
      },
    ],
  },
  {
    id: "105",
    title: "Payloads suspeitos no portal público de faturas",
    summary:
      "O WAF em modo de monitoramento registrou requisições com sintaxe SQL no parâmetro de busca do portal web, seguidas de respostas anormalmente grandes.",
    host: "web-front-01",
    telemetry: "Apache · WAF · DB Audit",
    answer: {
      attackerIp: "45.155.205.233",
      vector: "SQL Injection",
      port: 443,
      severity: "Critical",
      mitigation: "Aplicar WAF / Patch da Aplicação",
    },
    hints: {
      attackerIp: "O mesmo cliente HTTP aparece em todas as requisições com sintaxe SQL.",
      vector: "Observe operadores como UNION SELECT e OR 1=1 nos parâmetros.",
      port: "O tráfego chega via HTTPS na borda da aplicação.",
      severity: "A auditoria do banco confirma leitura da tabela de credenciais.",
      mitigation: "A falha está na própria aplicação, não em um host comprometido.",
    },
    logs: [
      {
        kind: "apache",
        level: "warn",
        raw: '45.155.205.233 - - [12/Sep/2026:14:02:11 +0000] "GET /invoices?search=1\' OR 1=1-- HTTP/1.1" 200 18422 "-" "python-requests/2.32"',
      },
      {
        kind: "apache",
        level: "warn",
        raw: '45.155.205.233 - - [12/Sep/2026:14:02:29 +0000] "GET /invoices?search=1\' UNION SELECT username,password FROM users-- HTTP/1.1" 200 219884 "-" "python-requests/2.32"',
      },
      {
        kind: "json",
        level: "crit",
        raw: '{"ts":"2026-09-12T14:02:30Z","source":"waf","event":"sqli_signature_match","rule":"942100","src_ip":"45.155.205.233","dst_port":443,"action":"log_only"}',
      },
      {
        kind: "json",
        level: "crit",
        raw: '{"ts":"2026-09-12T14:02:31Z","source":"db-audit","event":"table_read","table":"public.users","rows":9421,"app_user":"web_portal"}',
      },
      {
        kind: "apache",
        level: "info",
        raw: '10.4.12.9 - - [12/Sep/2026:14:03:02 +0000] "GET /health HTTP/1.1" 200 91 "-" "soc-monitor/2.1"',
      },
    ],
  },
  {
    id: "106",
    title: "Pico de tráfego de saída no fileserver corporativo",
    summary:
      "O Netflow apontou 6,4 GB de saída do fileserver-03 durante a madrugada, com o DLP classificando o conteúdo como dados pessoais.",
    host: "fileserver-03",
    telemetry: "Netflow · DLP · EDR",
    answer: {
      attackerIp: "91.219.236.18",
      vector: "Exfiltração de Dados",
      port: 21,
      severity: "Critical",
      mitigation: "Isolar Host",
    },
    hints: {
      attackerIp: "O destino externo do fluxo de saída é o mesmo em todos os eventos.",
      vector: "O DLP indica transferência de registros sensíveis para fora da rede.",
      port: "Veja o protocolo/porta usada na transferência em massa.",
      severity: "Dado pessoal já saiu do perímetro — impacto confirmado.",
      mitigation: "É preciso interromper o host que está enviando os arquivos.",
    },
    logs: [
      {
        kind: "json",
        level: "warn",
        raw: '{"ts":"2026-09-13T03:41:02Z","source":"edr-agent","event":"archive_created","host":"fileserver-03","user":"svc_report","path":"/tmp/.rpt-2026.tar.gz","size_mb":6210}',
      },
      {
        kind: "json",
        level: "crit",
        raw: '{"ts":"2026-09-13T03:44:19Z","source":"netflow","event":"egress_spike","host":"fileserver-03","bytes_out":6871947673,"proto":"tcp","dst_ip":"91.219.236.18","dst_port":21}',
      },
      {
        kind: "syslog",
        level: "warn",
        raw: "Sep 13 03:44:21 fileserver-03 ftp[8812]: STOR /tmp/.rpt-2026.tar.gz to 91.219.236.18 (anonymous session)",
      },
      {
        kind: "json",
        level: "crit",
        raw: '{"ts":"2026-09-13T03:46:07Z","source":"dlp","event":"sensitive_data_transfer","classification":"PII","records":184220,"channel":"ftp","peer":"91.219.236.18"}',
      },
      {
        kind: "syslog",
        level: "info",
        raw: "Sep 13 03:47:55 fileserver-03 ftp[8812]: session closed for user anonymous",
      },
    ],
  },
  {
    id: "107",
    title: "Estação de trabalho com beacon periódico para domínio desconhecido",
    summary:
      "O proxy detectou conexões em intervalos fixos de 60 segundos do host ws-fin-14 para um domínio recém-registrado, com payload codificado em base64.",
    host: "ws-fin-14",
    telemetry: "Proxy · DNS · EDR",
    answer: {
      attackerIp: "104.244.78.109",
      vector: "Malware C2",
      port: 8080,
      severity: "High",
      mitigation: "Isolar Host",
    },
    hints: {
      attackerIp: "Resolva o domínio suspeito no log de DNS para achar o endereço real.",
      vector: "Intervalos fixos e payload codificado são a assinatura clássica de beaconing.",
      port: "O proxy registra a porta de destino das conexões repetidas.",
      severity: "Há implante ativo na estação, mas nenhum dado sensível saiu ainda.",
      mitigation: "Contenha a máquina infectada antes que o operador avance na rede.",
    },
    logs: [
      {
        kind: "json",
        level: "warn",
        raw: '{"ts":"2026-09-14T09:15:00Z","source":"dns","event":"query","host":"ws-fin-14","qname":"cdn-update-check.top","answer":"104.244.78.109","domain_age_days":3}',
      },
      {
        kind: "json",
        level: "crit",
        raw: '{"ts":"2026-09-14T09:15:01Z","source":"proxy","event":"http_post","host":"ws-fin-14","dst_ip":"104.244.78.109","dst_port":8080,"uri":"/gate.php","body_encoding":"base64","bytes":812}',
      },
      {
        kind: "json",
        level: "crit",
        raw: '{"ts":"2026-09-14T09:16:01Z","source":"proxy","event":"http_post","host":"ws-fin-14","dst_ip":"104.244.78.109","dst_port":8080,"uri":"/gate.php","body_encoding":"base64","bytes":804}',
      },
      {
        kind: "json",
        level: "warn",
        raw: '{"ts":"2026-09-14T09:16:12Z","source":"edr-agent","event":"persistence_created","host":"ws-fin-14","mechanism":"scheduled_task","name":"CdnUpdateCheck"}',
      },
      {
        kind: "syslog",
        level: "info",
        raw: "Sep 14 09:17:01 ws-fin-14 edr: process svchost_update.exe parent=winword.exe integrity=medium",
      },
    ],
  },
  {
    id: "108",
    title: "Onda de logins no SSO com credenciais vazadas",
    summary:
      "O provedor de identidade registrou tentativas de login para centenas de contas distintas a partir de uma mesma origem, com poucos sucessos e sem MFA.",
    host: "sso-idp",
    telemetry: "IdP Logs · Proxy · Mail Gateway",
    answer: {
      attackerIp: "23.129.64.217",
      vector: "Credential Stuffing",
      port: 443,
      severity: "Medium",
      mitigation: "Revogar Sessões e Tokens",
    },
    hints: {
      attackerIp: "Uma única origem tenta muitas contas diferentes — o oposto do brute force.",
      vector: "Muitos usuários, uma senha por usuário: credenciais reaproveitadas de vazamento.",
      port: "O login do SSO acontece sobre HTTPS.",
      severity: "Poucas contas caíram e nenhuma tinha privilégio administrativo.",
      mitigation: "As sessões já emitidas para as contas afetadas precisam deixar de valer.",
    },
    logs: [
      {
        kind: "json",
        level: "warn",
        raw: '{"ts":"2026-09-14T17:02:04Z","source":"idp","event":"login_failed","src_ip":"23.129.64.217","dst_port":443,"user":"ana.souza","reason":"invalid_credentials"}',
      },
      {
        kind: "json",
        level: "warn",
        raw: '{"ts":"2026-09-14T17:02:05Z","source":"idp","event":"login_failed","src_ip":"23.129.64.217","dst_port":443,"user":"bruno.lima","reason":"invalid_credentials"}',
      },
      {
        kind: "json",
        level: "warn",
        raw: '{"ts":"2026-09-14T17:02:31Z","source":"idp","event":"anomaly","src_ip":"23.129.64.217","distinct_users":642,"success_ratio":0.006,"mfa_enrolled":false}',
      },
      {
        kind: "json",
        level: "crit",
        raw: '{"ts":"2026-09-14T17:03:12Z","source":"idp","event":"login_success","src_ip":"23.129.64.217","user":"carla.dias","role":"employee","token_ttl_h":12}',
      },
      {
        kind: "syslog",
        level: "info",
        raw: "Sep 14 17:04:20 mail-gw postfix/smtpd: password reset notification queued for carla.dias@empresa.com",
      },
    ],
  },
];

export type SolvedCase = {
  caseId: string;
  title: string;
  vector: AttackVector;
  severity: SeverityTag;
  accuracy: number;
  attempts: number;
  seconds: number;
};

export function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
