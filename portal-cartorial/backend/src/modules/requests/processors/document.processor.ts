/**
 * DocumentProcessor — C2: Worker Service (Bull)
 * Processa jobs da fila 'document-generation' de forma assincrona.
 */
import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';

interface DocumentJob {
  requestId: string;
  documentType: string;
  metadata: Record<string, any>;
}

@Processor('document-generation')
export class DocumentProcessor {
  private readonly logger = new Logger(DocumentProcessor.name);

  @Process('generate-pdf')
  async handleGeneratePdf(job: Job<DocumentJob>) {
    const { requestId, documentType } = job.data;
    this.logger.log(`Processando PDF: requestId=${requestId}, tipo=${documentType}`);

    try {
      this.logger.log(`[${requestId}] Gerando PDF para ${documentType}...`);
      await this.simulateDelay(2000);

      const fileKey = `documentos/${requestId}/${documentType}.pdf`;
      this.logger.log(`[${requestId}] Salvando no storage: ${fileKey}`);
      await this.simulateDelay(500);

      this.logger.log(`[${requestId}] Notificacao enviada ao cidadao`);
      this.logger.log(`[${requestId}] Documento gerado com sucesso!`);
      return { success: true, fileKey };
    } catch (error) {
      this.logger.error(`[${requestId}] Erro ao gerar documento: ${error.message}`);
      throw error;
    }
  }

  private simulateDelay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
