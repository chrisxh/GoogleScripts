# Script to copy messages from a GMail mailbox to a target group

`Based on the guidance at https://developers.google.com/admin-sdk/groups-migration/v1/guides/manage-email-migrations`

**Given** the current user has a mailbox containing much/all of the messages from a given @googlegroups.com group, 
**when** executed, this script will find messages from said group and
**then** generate topics in a target group, preserving threads, attachments, dates, etc.

## Requires

* Creation of Google Apps Script project https://script.google.com
* Advanced Google Services: enable `Groups Migration API`
