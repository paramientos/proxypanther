<?php

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Command;
use App\Services\LogParserService;

class IngestLogsCommand extends Command
{
    protected $signature = 'ingest:logs';
    protected $description = 'Ingest Caddy logs to update proxy statistics';

    /**
     * Execute the console command.
     */
    public function handle(LogParserService $parser)
    {
        $this->info('Starting log ingestion...');
        $parser->parseAll();
        $this->info('Log ingestion completed.');
    }
}
