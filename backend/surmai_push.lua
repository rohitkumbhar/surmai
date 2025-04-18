-- Sample Dovecot Webhook Script
-- Uses push_notification

-- extra.conf
--[[
protocol lmtp {
  mail_plugins = $mail_plugins mail_lua push_notification push_notification_lua
}


plugin {
  push_notification_driver = lua:file=/etc/dovecot/surmai_push.lua
  surmai_url = https://surmai.server/api/surmai/webhook
  surmai_secret = a-long-random-string-must-match-on-server
}
 ]]

--

local client = nil
local json = require "cjson"
local url = require "socket.url"

function table_get(t, k, d)
    return t[k] or d
end

function script_init()
    client = dovecot.http.client({debug = True, timeout = 10000})
    return 0
end

function dovecot_lua_notify_begin_txn(user)
    return {
        user = user,
        event = dovecot.event(),
        ep = user:plugin_getenv("surmai_url"),
        secret = user:plugin_getenv("surmai_secret"),
        states = {},
        messages = {}
    }
end

function dovecot_lua_notify_event_message_new(ctx, event)
    -- get mailbox status
    local mbox = ctx.user:mailbox(event.mailbox)
    mbox:sync()
    local status =
        mbox:status(dovecot.storage.STATUS_RECENT, dovecot.storage.STATUS_UNSEEN, dovecot.storage.STATUS_MESSAGES)
    mbox:free()
    ctx.states[event.mailbox] = status
    table.insert(
        ctx.messages,
        {
            subject = event.subject,
            mailbox = event.mailbox,
            uid = event.uid,
            from_address = event.from_address,
            from_display_name = event.from_display_name,
            to_address = event.to_address
        }
    )
end

function dovecot_lua_notify_event_message_append(ctx, event, user)
    dovecot_lua_notify_event_message_new(ctx, event, user)
end

function dovecot_lua_notify_end_txn(ctx)
    -- report all states
    for i, msg in ipairs(ctx.messages) do
        local e = dovecot.event(ctx.event)
        e:set_name("lua_notify_mail_finished")
        req_body = {
            mailbox = msg.mailbox,
            subject = table_get(msg, "subject", ""),
            uid = table_get(msg, "uid", ""),
            from_address = table_get(msg, "from_address", ""),
            from_display_name = table_get(msg, "from_display_name", ""),
            to_address = table_get(msg, "to_address", "")
        }

        local rq = client:request({url = ctx["ep"], method = "POST"})
        rq:set_payload(json.encode(req_body))
        rq:add_header("content-type", "application/json")
        rq:add_header("x-surmai-secret", ctx["secret"])
        local code = rq:submit():status()
        e:add_int("result_code", code)
        e:log_info("Mail notify status " .. tostring(code))
    end
end
